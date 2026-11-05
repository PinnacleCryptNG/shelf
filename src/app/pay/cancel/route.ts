import { baseUrlFrom } from "@/lib/base-url";
import { cancelCheckout, getOrderRow, getShopById } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = baseUrlFrom(req);
  const order = await getOrderRow(url.searchParams.get("order") || "");
  if (!order) return Response.redirect(`${base}/`, 302);
  const shop = await getShopById(order.shop_id);
  // PayPal appends ?token=<PayPal order id>; without it this is not a real cancel from PayPal.
  if (order.paypal_order_id && url.searchParams.get("token") === order.paypal_order_id) {
    await cancelCheckout(order).catch((e) => console.error("cancel failed", e));
  }
  return Response.redirect(`${base}/s/${shop?.slug}/receipt/${order.id}`, 302);
}
