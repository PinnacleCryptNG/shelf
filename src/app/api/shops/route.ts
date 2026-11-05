import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { z } from "zod";
import { sql, one } from "@/lib/db";
import { DraftSchema } from "@/lib/importer";
import { ownerCookie } from "@/lib/owner";
import { logEvent } from "@/lib/store";

const Body = z.object({
  draft: DraftSchema.extend({
    products: z.array(DraftSchema.shape.products.element.extend({ stock: z.number().int().nullable().optional() })).min(1).max(60),
  }),
  source_url: z.string().optional(),
  payee_email: z.string().email().optional().or(z.literal("")),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").slice(0, 40) || "shop";
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the shop details and try again." }, { status: 400 });
  const { draft, source_url, payee_email } = parsed.data;
  let slug = slugify(draft.shop.name);
  if (await one("select 1 from shops where slug = $1", [slug])) slug = `${slug}-${nanoid(4).toLowerCase()}`;
  const id = `shop_${nanoid(10)}`;
  const key = nanoid(24);
  await sql(
    `insert into shops (id, slug, name, tagline, about, city, country, currency, source_url, payee_email, owner_key, ships_to)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [id, slug, draft.shop.name, draft.shop.tagline, draft.shop.about, draft.shop.city, draft.shop.country, draft.shop.currency,
      source_url || null, payee_email || null, key, draft.shop.ships_to],
  );
  let pos = 0;
  for (const p of draft.products) {
    await sql(
      `insert into products (id, shop_id, name, description, price_cents, currency, category, tags, image_url, stock, position)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [`p_${nanoid(10)}`, id, p.name, p.description, Math.round(p.price * 100), draft.shop.currency, p.category,
        p.tags.map((t) => t.toLowerCase()).slice(0, 8), p.image_url?.startsWith("http") ? p.image_url : null, p.stock ?? null, pos++],
    );
  }
  await logEvent(id, "created", `Shop drafted with ${draft.products.length} products`, undefined, "owner");
  (await cookies()).set(ownerCookie(slug), key, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return Response.json({ slug, owner_key: key });
}
