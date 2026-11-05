import { baseUrlFrom } from "@/lib/base-url";
import { getShop, listProducts } from "@/lib/store";
import { formatMoney } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const shop = await getShop((await params).slug);
  if (!shop?.published) return new Response("Not found", { status: 404 });
  const base = baseUrlFrom(req);
  const products = await listProducts(shop.id);
  const body = [
    `# ${shop.name}`,
    `> ${shop.tagline}`,
    "",
    shop.about,
    "",
    `Location: ${[shop.city, shop.country].filter(Boolean).join(", ")}`,
    `Currency: ${shop.currency}`,
    `Fulfilment: ${shop.ships_to}`,
    "",
    "## How AI agents can buy here",
    `- MCP server (streamable HTTP): ${base}/s/${shop.slug}/mcp`,
    `- Product feed (JSON): ${base}/s/${shop.slug}/feed.json`,
    "- Tools: get_shop_info, search_products, create_checkout, get_order_status",
    "- Payment is PayPal. create_checkout returns an approval link; the human buyer must approve it. Never treat an order as paid until get_order_status says PAID.",
    "",
    "## Products",
    ...products.map((p) => `- ${p.name} — ${formatMoney(p.price_cents, p.currency)}${p.stock === 0 ? " (sold out)" : ""}: ${p.description} [product_id: ${p.id}]`),
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "access-control-allow-origin": "*" } });
}
