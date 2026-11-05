export type Shop = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  about: string;
  city: string;
  country: string;
  currency: string;
  source_url: string | null;
  payee_email: string | null;
  owner_key: string;
  ships_to: string;
  accent: string;
  is_demo: boolean;
  published: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  category: string;
  tags: string[];
  image_url: string | null;
  image_credit?: string | null;
  stock: number | null;
  paypal_product_id: string | null;
  position: number;
  active: boolean;
};

export type OrderItem = { product_id: string; name: string; quantity: number; unit_cents: number };

export type Order = {
  id: string;
  shop_id: string;
  paypal_order_id: string | null;
  status: "CREATED" | "APPROVED" | "PAID" | "SHIPPED" | "REFUNDED" | "CANCELLED";
  channel: "agent" | "web";
  agent_name: string | null;
  items: OrderItem[];
  total_cents: number;
  currency: string;
  note: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  capture_id: string | null;
  tracking: { carrier: string; number: string } | null;
  refund_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ShopEvent = {
  id: number;
  shop_id: string;
  kind: string;
  actor: string;
  summary: string;
  data: unknown;
  created_at: string;
};

export const PAYPAL_CURRENCIES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF",
  "NZD", "SGD", "HKD", "MXN", "BRL", "ILS", "MYR", "PHP", "THB", "TWD", "CNY",
] as const;

const ZERO_DECIMAL = new Set(["JPY", "HUF", "TWD"]);

export function minorUnits(currency: string) {
  return ZERO_DECIMAL.has(currency) ? 0 : 2;
}

export function toPayPalValue(cents: number, currency: string) {
  return ZERO_DECIMAL.has(currency) ? String(Math.round(cents / 100)) : (cents / 100).toFixed(2);
}

export function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: minorUnits(currency),
    maximumFractionDigits: minorUnits(currency),
  }).format(cents / 100);
}
