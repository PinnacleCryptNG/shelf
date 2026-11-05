import { baseUrlFrom } from "@/lib/base-url";
import { getOrderRow, getShopById, settlePayPalOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = baseUrlFrom(req);
  const order = await getOrderRow(url.searchParams.get("order") || "");
  if (!order?.paypal_order_id) return Response.redirect(`${base}/`, 302);
  const shop = await getShopById(order.shop_id);
  try {
    await settlePayPalOrder(order.paypal_order_id);
  } catch (e) {
    console.error("capture failed", e);
  }
  return Response.redirect(`${base}/s/${shop?.slug}/receipt/${order.id}`, 302);
}
