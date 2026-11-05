import "server-only";
import { nanoid } from "nanoid";
import { one, sql } from "./db";
import { captureOrder, createOrder, getOrder, type PayPalOrder } from "./paypal";
import { formatMoney, type Order, type OrderItem, type Product, type Shop, type ShopEvent } from "./types";

export const getShop = (slug: string) => one<Shop>("select * from shops where slug = $1", [slug]);
export const getShopById = (id: string) => one<Shop>("select * from shops where id = $1", [id]);

export const listShops = () =>
  sql<Shop & { product_count: number }>(
    `select s.*, (select count(*)::int from products p where p.shop_id = s.id and p.active) as product_count
     from shops s where s.published order by s.is_demo asc, s.created_at desc limit 200`,
  );

export const listProducts = (shopId: string, all = false) =>
  sql<Product>(
    `select * from products where shop_id = $1 ${all ? "" : "and active"} order by position, created_at`,
    [shopId],
  );

export const listDirectoryProducts = () =>
  sql<Product>(
    `select p.* from products p join shops s on s.id = p.shop_id
     where s.published and p.active order by p.position, p.created_at limit 5000`,
  );

export const getProduct = (id: string) => one<Product>("select * from products where id = $1", [id]);

export const listOrders = (shopId: string) =>
  sql<Order>("select * from orders where shop_id = $1 order by created_at desc limit 100", [shopId]);

export const getOrderRow = (id: string) => one<Order>("select * from orders where id = $1", [id]);
export const getOrderByPayPalId = (id: string) => one<Order>("select * from orders where paypal_order_id = $1", [id]);

export const listEvents = (shopId: string, after = 0) =>
  sql<ShopEvent>("select * from events where shop_id = $1 and id > $2 order by id desc limit 60", [shopId, after]);

export async function logEvent(shopId: string, kind: string, summary: string, data?: unknown, actor = "agent") {
  await sql("insert into events (shop_id, kind, actor, summary, data) values ($1,$2,$3,$4,$5)", [
    shopId, kind, actor, summary.slice(0, 300), data === undefined ? null : JSON.stringify(data),
  ]);
}

function words(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter((w) => w.length > 1);
}

export function rankProducts(products: Product[], query?: string, maxPriceCents?: number, category?: string) {
  let list = products.filter((p) => p.active && (p.stock === null || p.stock > 0));
  if (maxPriceCents) list = list.filter((p) => p.price_cents <= maxPriceCents);
  if (category) list = list.filter((p) => p.category.toLowerCase().includes(category.toLowerCase()));
  const q = words(query || "");
  if (!q.length) return list;
  const scored = list.map((p) => {
    const name = words(p.name), tags = p.tags.flatMap(words), cat = words(p.category), desc = words(p.description);
    let score = 0;
    for (const w of q) {
      const stem = w.replace(/(es|s)$/, "");
      const hit = (arr: string[]) => arr.some((x) => x === w || x.startsWith(stem) || (stem.length > 3 && x.includes(stem)));
      if (hit(name)) score += 3;
      if (hit(tags)) score += 2;
      if (hit(cat)) score += 2;
      if (hit(desc)) score += 1;
    }
    return { p, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.p);
}

export function publicProduct(p: Product, shop: Shop, base: string) {
  return {
    product_id: p.id,
    name: p.name,
    description: p.description,
    price: formatMoney(p.price_cents, p.currency),
    price_minor_units: p.price_cents,
    currency: p.currency,
    category: p.category,
    tags: p.tags,
    in_stock: p.stock === null ? true : p.stock > 0,
    stock: p.stock,
    image_url: p.image_url,
    url: `${base}/s/${shop.slug}#${p.id}`,
    shop: shop.slug,
  };
}

export function publicShop(s: Shop, base: string) {
  return {
    shop: s.slug,
    name: s.name,
    tagline: s.tagline,
    about: s.about,
    location: [s.city, s.country].filter(Boolean).join(", "),
    currency: s.currency,
    fulfilment: s.ships_to,
    storefront: `${base}/s/${s.slug}`,
    mcp_endpoint: `${base}/s/${s.slug}/mcp`,
    payments: "PayPal. Every order needs the buyer to approve it in PayPal before any money moves.",
  };
}

export class CheckoutError extends Error {}

export async function createCheckout(opts: {
  shop: Shop;
  items: { product_id: string; quantity: number }[];
  channel: "agent" | "web";
  agentName?: string | null;
  note?: string | null;
  base: string;
}) {
  const { shop, base } = opts;
  if (!opts.items.length) throw new CheckoutError("Add at least one item.");
  const products = await listProducts(shop.id);
  const lines: OrderItem[] = [];
  for (const it of opts.items) {
    const p = products.find((x) => x.id === it.product_id);
    if (!p) throw new CheckoutError(`Unknown product_id ${it.product_id} for ${shop.name}. Call search_products first.`);
    const existing = lines.find((l) => l.product_id === p.id);
    const qty = Math.max(1, Math.floor(it.quantity || 1));
    const combined = (existing?.quantity || 0) + qty;
    if (combined > 20) throw new CheckoutError(`At most 20 of ${p.name} per order.`);
    if (p.stock !== null && p.stock < combined) throw new CheckoutError(`Only ${p.stock} left of ${p.name}.`);
    if (existing) existing.quantity = combined;
    else lines.push({ product_id: p.id, name: p.name, quantity: qty, unit_cents: p.price_cents });
  }
  const total = lines.reduce((s, l) => s + l.unit_cents * l.quantity, 0);
  const id = `ord_${nanoid(10)}`;
  const pp = await createOrder({
    shopName: shop.name,
    orderRef: id,
    currency: shop.currency,
    items: lines.map((l) => ({ name: l.name, sku: l.product_id, quantity: l.quantity, unit_cents: l.unit_cents })),
    payeeEmail: shop.payee_email,
    returnUrl: `${base}/pay/return?order=${id}`,
    cancelUrl: `${base}/pay/cancel?order=${id}`,
  });
  await sql(
    `insert into orders (id, shop_id, paypal_order_id, status, channel, agent_name, items, total_cents, currency, note)
     values ($1,$2,$3,'CREATED',$4,$5,$6,$7,$8,$9)`,
    [id, shop.id, pp.id, opts.channel, opts.agentName || null, JSON.stringify(lines), total, shop.currency, opts.note?.slice(0, 500) || null],
  );
  const who = opts.channel === "agent" ? opts.agentName || "An AI agent" : "A shopper";
  await logEvent(shop.id, "checkout", `${who} opened a ${formatMoney(total, shop.currency)} PayPal checkout`, { order_id: id, paypal_order_id: pp.id, lines }, opts.channel === "agent" ? "agent" : "web");
  return { order_id: id, paypal_order_id: pp.id, approve_url: pp.approveUrl, total: formatMoney(total, shop.currency), lines };
}

async function releaseStock(items: OrderItem[]) {
  for (const l of items) await sql("update products set stock = stock + $2 where id = $1 and stock is not null", [l.product_id, l.quantity]);
}

/** Atomically takes stock for every line, or nothing. Prevents two buyers paying for the last item. */
async function reserveStock(items: OrderItem[]) {
  const taken: OrderItem[] = [];
  for (const l of items) {
    const ok = await one("update products set stock = stock - $2 where id = $1 and active and (stock is null or stock >= $2) returning id", [l.product_id, l.quantity]);
    if (!ok) {
      await releaseStock(taken);
      return false;
    }
    taken.push(l);
  }
  return true;
}

/**
 * Moves an approved PayPal order to PAID. Safe to call from the return URL, the webhook and
 * get_order_status at the same time: a conditional claim lets exactly one caller capture.
 * Cancelled or expired orders are never captured.
 */
export async function settlePayPalOrder(paypalOrderId: string) {
  const order = await getOrderByPayPalId(paypalOrderId);
  if (!order) return null;
  if (order.status !== "CREATED" && order.status !== "APPROVED") return order;
  const claimed = await one<Order>(
    `update orders set status = 'APPROVED', updated_at = now()
     where id = $1 and (status = 'CREATED' or (status = 'APPROVED' and updated_at < now() - interval '5 minutes')) returning *`,
    [order.id],
  );
  if (!claimed) return getOrderRow(order.id);
  const revert = async () =>
    (await one<Order>("update orders set status = 'CREATED', updated_at = now() where id = $1 and status = 'APPROVED' returning *", [order.id])) || order;

  let pp: PayPalOrder;
  try {
    pp = await getOrder(paypalOrderId);
  } catch (e) {
    await revert();
    throw e;
  }
  if (pp.status !== "APPROVED" && pp.status !== "COMPLETED") return revert();

  const reserve = pp.status === "APPROVED";
  if (reserve && !(await reserveStock(order.items))) {
    const cancelled = await one<Order>("update orders set status = 'CANCELLED', updated_at = now() where id = $1 returning *", [order.id]);
    await logEvent(order.shop_id, "cancelled", "Sold out before the payment went through, so PayPal did not charge the buyer.", { order_id: order.id }, "paypal");
    return cancelled;
  }

  let done: PayPalOrder;
  try {
    done = reserve ? await captureOrder(paypalOrderId) : pp;
  } catch (e) {
    if (reserve) await releaseStock(order.items);
    await revert();
    throw e;
  }
  const capture = done.purchase_units?.[0]?.payments?.captures?.[0];
  if (done.status !== "COMPLETED" || !capture) {
    if (reserve) await releaseStock(order.items);
    return revert();
  }
  const name = [done.payer?.name?.given_name, done.payer?.name?.surname].filter(Boolean).join(" ") || null;
  const updated = await one<Order>(
    `update orders set status = 'PAID', capture_id = $2, buyer_name = $3, buyer_email = $4, updated_at = now()
     where id = $1 and status = 'APPROVED' returning *`,
    [order.id, capture.id, name, done.payer?.email_address || null],
  );
  if (updated) {
    await logEvent(order.shop_id, "paid", `${name || "The buyer"} paid ${formatMoney(order.total_cents, order.currency)} with PayPal`, { order_id: order.id, capture_id: capture.id }, "paypal");
  }
  return updated || (await getOrderRow(order.id));
}

/** Buyer pressed cancel in PayPal. If PayPal says they actually approved, settle instead. */
export async function cancelCheckout(order: Order) {
  if (order.status !== "CREATED") return order;
  if (order.paypal_order_id) {
    const pp = await getOrder(order.paypal_order_id).catch(() => null);
    if (pp && (pp.status === "APPROVED" || pp.status === "COMPLETED")) return (await settlePayPalOrder(order.paypal_order_id)) || order;
  }
  const updated = await one<Order>("update orders set status = 'CANCELLED', updated_at = now() where id = $1 and status = 'CREATED' returning *", [order.id]);
  if (updated) await logEvent(order.shop_id, "cancelled", "The buyer cancelled in PayPal. No money moved.", { order_id: order.id }, "paypal");
  return updated || (await getOrderRow(order.id)) || order;
}

/** Checkouts nobody approved within 6 hours are closed so they stop cluttering the dashboard. */
export async function expireStaleCheckouts(shopId: string) {
  const rows = await sql<{ id: string }>(
    "update orders set status = 'CANCELLED', updated_at = now() where shop_id = $1 and status = 'CREATED' and created_at < now() - interval '6 hours' returning id",
    [shopId],
  );
  for (const r of rows) await logEvent(shopId, "cancelled", "Checkout expired without payment. No money moved.", { order_id: r.id }, "paypal");
}

/** A refund made outside Shelf (e.g. in the PayPal dashboard), reported by webhook. */
export async function recordExternalRefund(paypalOrderId: string, refundId: string | null) {
  const o = await one<Order>(
    "update orders set status = 'REFUNDED', refund_id = coalesce(refund_id, $2), updated_at = now() where paypal_order_id = $1 and status in ('PAID','SHIPPED') returning *",
    [paypalOrderId, refundId],
  );
  if (o) await logEvent(o.shop_id, "refunded", `Refund of ${formatMoney(o.total_cents, o.currency)} recorded from PayPal`, { order_id: o.id, refund_id: refundId }, "paypal");
  return o;
}

/** What a visitor to a public demo dashboard may see: no buyer emails, initials only. */
export function redactOrder(o: Order): Order {
  const name = o.buyer_name ? o.buyer_name.split(/\s+/).map((w, i) => (i === 0 ? w : `${w[0]}.`)).join(" ") : null;
  return { ...o, buyer_name: name, buyer_email: null };
}

export async function orderStatusForAgent(orderId: string) {
  let order = await getOrderRow(orderId);
  if (!order) return null;
  if (order.status === "CREATED" && order.paypal_order_id) order = (await settlePayPalOrder(order.paypal_order_id)) || order;
  const explain: Record<Order["status"], string> = {
    CREATED: "Waiting for the buyer to approve the payment in PayPal.",
    APPROVED: "Approved in PayPal, capture in progress.",
    PAID: "Paid. The shop has been notified and will prepare the order.",
    SHIPPED: "Paid and shipped.",
    REFUNDED: "Refunded to the buyer through PayPal.",
    CANCELLED: "Cancelled. No money moved.",
  };
  return {
    order_id: order.id,
    status: order.status,
    meaning: explain[order.status],
    total: formatMoney(order.total_cents, order.currency),
    items: order.items.map((l) => `${l.quantity} × ${l.name}`),
    tracking: order.tracking,
  };
}
