import { z } from "zod";
import { one } from "@/lib/db";
import { isOwner } from "@/lib/owner";
import { addTracking, refundCapture } from "@/lib/paypal";
import { getOrderRow, getShop, logEvent } from "@/lib/store";
import { formatMoney, type Order } from "@/lib/types";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ship"), carrier: z.string().min(2).max(40), number: z.string().min(3).max(64) }),
  z.object({ action: z.literal("refund"), reason: z.string().max(255).optional() }),
]);

export async function POST(req: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const p = await params;
  const shop = await getShop(p.slug);
  if (!shop || !(await isOwner(shop))) return Response.json({ error: "Not your shop." }, { status: 403 });
  const order = await getOrderRow(p.id);
  if (!order || order.shop_id !== shop.id) return Response.json({ error: "Order not found." }, { status: 404 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Bad request." }, { status: 400 });
  if (!order.capture_id || !order.paypal_order_id) return Response.json({ error: "This order has not been paid yet." }, { status: 409 });
  if (!["PAID", "SHIPPED"].includes(order.status)) return Response.json({ error: `This order is ${order.status.toLowerCase()}.` }, { status: 409 });
  try {
    if (body.data.action === "ship") {
      await addTracking(order.paypal_order_id, order.capture_id, body.data.carrier, body.data.number);
      const updated = await one<Order>("update orders set status = 'SHIPPED', tracking = $2, updated_at = now() where id = $1 and status in ('PAID','SHIPPED') returning *", [
        order.id, JSON.stringify({ carrier: body.data.carrier, number: body.data.number }),
      ]);
      await logEvent(shop.id, "shipped", `Tracking ${body.data.number} (${body.data.carrier}) added in PayPal`, { order_id: order.id }, "owner");
      return Response.json({ order: updated });
    }
    const refund = await refundCapture(order.capture_id, body.data.reason || `Refund from ${shop.name}`);
    const updated = await one<Order>("update orders set status = 'REFUNDED', refund_id = $2, updated_at = now() where id = $1 returning *", [order.id, refund.id]);
    await logEvent(shop.id, "refunded", `Refunded ${formatMoney(order.total_cents, order.currency)} through PayPal`, { order_id: order.id, refund_id: refund.id }, "owner");
    return Response.json({ order: updated });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message.slice(0, 300) : "PayPal error" }, { status: 502 });
  }
}
