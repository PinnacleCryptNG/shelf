import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { z } from "zod";
import { sql, one } from "@/lib/db";
import { limited, readJson } from "@/lib/guard";
import { PAYPAL_CURRENCIES } from "@/lib/types";
import { ownerCookie } from "@/lib/owner";
import { logEvent } from "@/lib/store";
import { findPhoto } from "@/lib/photos";

const text = (max: number) => z.string().trim().max(max);
const Body = z.object({
  draft: z.object({
    shop: z.object({
      name: text(80).min(1),
      tagline: text(140),
      about: text(800),
      city: text(80),
      country: text(80),
      currency: z.enum(PAYPAL_CURRENCIES),
      ships_to: text(200),
    }),
    products: z.array(z.object({
      name: text(127).min(1),
      description: text(600),
      price: z.number().positive().max(100_000),
      category: text(60),
      tags: z.array(text(40)).max(12),
      image_url: z.string().url().max(1000).nullable(),
      stock: z.number().int().min(0).max(100_000).nullable().optional(),
    })).min(1).max(60),
  }),
  source_url: z.string().url().max(2000).optional(),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").slice(0, 40) || "shop";
}

export async function POST(req: Request) {
  const blocked = await limited(req, "create");
  if (blocked) return blocked;
  const parsed = Body.safeParse(await readJson(req, 200_000));
  if (!parsed.success) return Response.json({ error: "Check the shop details and try again." }, { status: 400 });
  const { draft, source_url } = parsed.data;
  let slug = slugify(draft.shop.name);
  if (await one("select 1 from shops where slug = $1", [slug])) slug = `${slug}-${nanoid(4).toLowerCase()}`;
  const id = `shop_${nanoid(10)}`;
  const key = nanoid(24);
  await sql(
    `insert into shops (id, slug, name, tagline, about, city, country, currency, source_url, payee_email, owner_key, ships_to)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [id, slug, draft.shop.name, draft.shop.tagline, draft.shop.about, draft.shop.city, draft.shop.country, draft.shop.currency,
      source_url || null, null, key, draft.shop.ships_to],
  );
  const photos = await Promise.all(draft.products.map((p) => (p.image_url?.startsWith("https://") ? { url: p.image_url, credit: null } : findPhoto(p.name, p.category))));
  let pos = 0;
  for (const [i, p] of draft.products.entries()) {
    await sql(
      `insert into products (id, shop_id, name, description, price_cents, currency, category, tags, image_url, image_credit, stock, position)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [`p_${nanoid(10)}`, id, p.name, p.description, Math.round(p.price * 100), draft.shop.currency, p.category,
        p.tags.map((t) => t.toLowerCase()).slice(0, 8), photos[i]?.url ?? null, photos[i]?.credit ?? null, p.stock ?? null, pos++],
    );
  }
  await logEvent(id, "created", `Shop drafted with ${draft.products.length} products`, undefined, "owner");
  (await cookies()).set(ownerCookie(slug), key, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return Response.json({ slug, owner_key: key });
}
