import { verifyWebhook } from "@/lib/paypal";
import { settlePayPalOrder } from "@/lib/store";

export async function POST(req: Request) {
  const event = (await req.json().catch(() => null)) as { event_type?: string; resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } } } | null;
  if (!event?.event_type) return Response.json({ ok: false }, { status: 400 });
  if (!(await verifyWebhook(req.headers, event).catch(() => false))) return Response.json({ ok: false }, { status: 401 });
  const orderId =
    event.event_type === "CHECKOUT.ORDER.APPROVED" ? event.resource?.id : event.resource?.supplementary_data?.related_ids?.order_id;
  if (orderId && ["CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED"].includes(event.event_type)) {
    await settlePayPalOrder(orderId);
  }
  return Response.json({ ok: true });
}
