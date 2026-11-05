import { canView, isOwner } from "@/lib/owner";
import { expireStaleCheckouts, getShop, listEvents, listOrders, listProducts, redactOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const shop = await getShop((await params).slug);
  if (!shop || !(await canView(shop))) return Response.json({ error: "Not your shop." }, { status: 403 });
  const owner = await isOwner(shop);
  const after = Number(new URL(req.url).searchParams.get("after") || 0);
  await expireStaleCheckouts(shop.id);
  const [events, orders, products] = await Promise.all([listEvents(shop.id, after), listOrders(shop.id), listProducts(shop.id, true)]);
  return Response.json({
    events,
    orders: owner ? orders : orders.map(redactOrder),
    products: products.map((p) => ({ id: p.id, name: p.name, price_cents: p.price_cents, stock: p.stock, synced: Boolean(p.paypal_product_id) })),
  });
}
