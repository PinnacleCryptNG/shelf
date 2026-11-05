import "server-only";
import { cookies } from "next/headers";
import type { Shop } from "./types";

export const ownerCookie = (slug: string) => `shelf_k_${slug}`;

export async function isOwner(shop: Shop, key?: string | null) {
  if (shop.is_demo) return true;
  const jar = await cookies();
  const k = key || jar.get(ownerCookie(shop.slug))?.value;
  return Boolean(k && k === shop.owner_key);
}
