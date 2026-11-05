import "server-only";
import { nanoid } from "nanoid";
import { one, sql } from "./db";
import { captureOrder, createOrder, getOrder } from "./paypal";
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
    const qty = Math.max(1, Math.min(20, Math.floor(it.quantity || 1)));
    if (p.stock !== null && p.stock < qty) throw new CheckoutError(`Only ${p.stock} left of ${p.name}.`);
    const existing = lines.find((l) => l.product_id === p.id);
    if (existing) existing.quantity += qty;
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

export async function settlePayPalOrder(paypalOrderId: string) {
  const order = await getOrderByPayPalId(paypalOrderId);
  if (!order) return null;
  if (["PAID", "SHIPPED", "REFUNDED"].includes(order.status)) return order;
  const status = await getOrder(paypalOrderId);
  if (status.status !== "APPROVED" && status.status !== "COMPLETED") return order;
  const done = status.status === "COMPLETED" ? status : await captureOrder(paypalOrderId);
  const capture = done.purchase_units?.[0]?.payments?.captures?.[0];
  if (done.status !== "COMPLETED" || !capture) return order;
  const name = [done.payer?.name?.given_name, done.payer?.name?.surname].filter(Boolean).join(" ") || null;
  const updated = await one<Order>(
    `update orders set status = 'PAID', capture_id = $2, buyer_name = $3, buyer_email = $4, updated_at = now()
     where id = $1 and status in ('CREATED','APPROVED') returning *`,
    [order.id, capture.id, name, done.payer?.email_address || null],
  );
  if (updated) {
    for (const l of order.items) {
      await sql("update products set stock = greatest(stock - $2, 0) where id = $1 and stock is not null", [l.product_id, l.quantity]);
    }
    await logEvent(order.shop_id, "paid", `${name || "The buyer"} paid ${formatMoney(order.total_cents, order.currency)} with PayPal`, { order_id: order.id, capture_id: capture.id }, "paypal");
  }
  return updated || (await getOrderRow(order.id));
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
