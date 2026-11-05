import { isOwner } from "@/lib/owner";
import { getShop, listEvents, listOrders } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const shop = await getShop((await params).slug);
  if (!shop || !(await isOwner(shop))) return Response.json({ error: "Not your shop." }, { status: 403 });
  const after = Number(new URL(req.url).searchParams.get("after") || 0);
  const [events, orders] = await Promise.all([listEvents(shop.id, after), listOrders(shop.id)]);
  return Response.json({ events, orders });
}
