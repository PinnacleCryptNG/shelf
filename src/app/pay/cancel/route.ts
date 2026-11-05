import { sql } from "@/lib/db";
import { baseUrlFrom } from "@/lib/base-url";
import { getOrderRow, getShopById, logEvent } from "@/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = baseUrlFrom(req);
  const order = await getOrderRow(url.searchParams.get("order") || "");
  if (!order) return Response.redirect(`${base}/`, 302);
  const shop = await getShopById(order.shop_id);
  if (order.status === "CREATED") {
    await sql("update orders set status = 'CANCELLED', updated_at = now() where id = $1", [order.id]);
    await logEvent(order.shop_id, "cancelled", "The buyer cancelled in PayPal. No money moved.", { order_id: order.id }, "paypal");
  }
  return Response.redirect(`${base}/s/${shop?.slug}/receipt/${order.id}`, 302);
}
