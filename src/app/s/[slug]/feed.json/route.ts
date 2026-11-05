import { baseUrlFrom } from "@/lib/base-url";
import { getShop, listProducts, publicProduct, publicShop } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const shop = await getShop((await params).slug);
  if (!shop?.published) return Response.json({ error: "Shop not found" }, { status: 404 });
  const base = baseUrlFrom(req);
  const products = await listProducts(shop.id);
  return Response.json(
    { version: "shelf-feed/1", shop: publicShop(shop, base), products: products.map((p) => publicProduct(p, shop, base)) },
    { headers: { "access-control-allow-origin": "*" } },
  );
}
