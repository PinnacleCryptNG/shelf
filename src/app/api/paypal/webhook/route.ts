import { readJson } from "@/lib/guard";
import { verifyWebhook } from "@/lib/paypal";
import { recordExternalRefund, settlePayPalOrder } from "@/lib/store";

type Event = { event_type?: string; resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } } };

export async function POST(req: Request) {
  const event = await readJson<Event>(req, 200_000);
  if (!event?.event_type) return Response.json({ ok: false }, { status: 400 });
  if (!(await verifyWebhook(req.headers, event).catch(() => false))) return Response.json({ ok: false }, { status: 401 });
  const related = event.resource?.supplementary_data?.related_ids?.order_id;
  switch (event.event_type) {
    case "CHECKOUT.ORDER.APPROVED":
      if (event.resource?.id) await settlePayPalOrder(event.resource.id);
      break;
    case "PAYMENT.CAPTURE.COMPLETED":
      if (related) await settlePayPalOrder(related);
      break;
    case "PAYMENT.CAPTURE.REFUNDED":
      if (related) await recordExternalRefund(related, event.resource?.id || null);
      break;
  }
  return Response.json({ ok: true });
}
