import { baseUrlFrom } from "@/lib/base-url";
import { limited } from "@/lib/guard";
import { cookieNameFor, isOwner } from "@/lib/owner";
import { getShop } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const base = baseUrlFrom(req);
  const blocked = await limited(req, "owner");
  if (blocked) return blocked;
  const shop = await getShop(slug);
  if (!shop) return Response.redirect(`${base}/`, 302);
  const key = new URL(req.url).searchParams.get("key");
  const res = new Response(null, { status: 302, headers: { location: `${base}/s/${shop.slug}/dashboard`, "cache-control": "no-store", "referrer-policy": "no-referrer" } });
  if (key && (await isOwner(shop, key))) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.headers.append("set-cookie", `${cookieNameFor(shop)}=${encodeURIComponent(key)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`);
  }
  return res;
}
