import { sql } from "@/lib/db";
import { baseUrlFrom } from "@/lib/base-url";
import { limited } from "@/lib/guard";
import { isOwner } from "@/lib/owner";
import { createCatalogProduct, paypalConfigured } from "@/lib/paypal";
import { getShop, listProducts, logEvent } from "@/lib/store";

export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const shop = await getShop((await params).slug);
  if (!shop || !(await isOwner(shop))) return Response.json({ error: "Not your shop." }, { status: 403 });
  const blocked = await limited(req, "publish");
  if (blocked) return blocked;
  const base = baseUrlFrom(req);
  const products = await listProducts(shop.id, true);
  let synced = 0;
  const errors: string[] = [];
  for (const p of products) {
    if (p.paypal_product_id) { synced++; continue; }
    try {
      const ppId = await createCatalogProduct({ name: p.name, description: p.description, imageUrl: p.image_url?.startsWith("/") ? `${base}${p.image_url}` : p.image_url, homeUrl: `${base}/s/${shop.slug}`, ref: p.id });
      await sql("update products set paypal_product_id = $2 where id = $1", [p.id, ppId]);
      synced++;
    } catch (e) {
      errors.push(`${p.name}: ${e instanceof Error ? e.message.slice(0, 160) : "failed"}`);
    }
  }
  await sql("update shops set published = true where id = $1", [shop.id]);
  await logEvent(shop.id, "published", `Published ${synced} products to the PayPal catalog${paypalConfigured() ? "" : " (mock mode)"} and opened the shop to agents`, { errors }, "owner");
  return Response.json({ synced, errors, mcp: `${base}/s/${shop.slug}/mcp` });
}
