import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Shop } from "./types";

export const ownerCookie = (slug: string) => `shelf_k_${slug}`;
export const DEMO_COOKIE = "shelf_demo";

function same(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const cookieNameFor = (shop: Shop) => (shop.is_demo ? DEMO_COOKIE : ownerCookie(shop.slug));

/** Full owner rights: refunds, tracking, publishing, write tools in the copilot. */
export async function isOwner(shop: Shop, key?: string | null) {
  const given = key || (await cookies()).get(cookieNameFor(shop))?.value;
  if (shop.is_demo) {
    const demoKey = process.env.SHELF_DEMO_KEY;
    if (!demoKey) return process.env.NODE_ENV !== "production";
    return same(given, demoKey);
  }
  return same(given, shop.owner_key);
}

/** Demo dashboards are public but read-only for visitors. */
export async function canView(shop: Shop) {
  return shop.is_demo || (await isOwner(shop));
}
