import "server-only";
import { nanoid } from "nanoid";
import { toPayPalValue } from "./types";

const ENV = (process.env.PAYPAL_ENVIRONMENT || "SANDBOX").toUpperCase();
export const PAYPAL_API = ENV === "PRODUCTION" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export function paypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

let cached: { token: string; exp: number } | null = null;

export async function accessToken() {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

export class PayPalError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`PayPal ${status}: ${JSON.stringify(body).slice(0, 400)}`);
  }
}

async function pp<T>(path: string, init: { method?: string; body?: unknown; requestId?: string } = {}): Promise<T> {
  const res = await fetch(`${PAYPAL_API}${path}`, {
    method: init.method || "GET",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new PayPalError(res.status, json);
  return json as T;
}

type Link = { href: string; rel: string };
export type PayPalOrder = {
  id: string;
  status: string;
  links?: Link[];
  payer?: { name?: { given_name?: string; surname?: string }; email_address?: string };
  purchase_units?: {
    custom_id?: string;
    payments?: { captures?: { id: string; status: string }[] };
  }[];
};

export type CheckoutInput = {
  shopName: string;
  orderRef: string;
  currency: string;
  items: { name: string; sku: string; quantity: number; unit_cents: number; description?: string }[];
  payeeEmail?: string | null;
  returnUrl: string;
  cancelUrl: string;
};

export async function createOrder(input: CheckoutInput): Promise<{ id: string; approveUrl: string }> {
  const total = input.items.reduce((s, i) => s + i.unit_cents * i.quantity, 0);
  if (!paypalConfigured()) {
    const id = `MOCK-${nanoid(12).toUpperCase()}`;
    return { id, approveUrl: `${input.returnUrl.split("/pay/")[0]}/pay/mock?token=${id}` };
  }
  const order = await pp<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    requestId: `create-${input.orderRef}`,
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderRef,
          custom_id: input.orderRef,
          invoice_id: `SHELF-${input.orderRef}`,
          description: `${input.shopName} via Shelf`.slice(0, 127),
          soft_descriptor: "SHELF",
          ...(input.payeeEmail ? { payee: { email_address: input.payeeEmail } } : {}),
          amount: {
            currency_code: input.currency,
            value: toPayPalValue(total, input.currency),
            breakdown: { item_total: { currency_code: input.currency, value: toPayPalValue(total, input.currency) } },
          },
          items: input.items.map((i) => ({
            name: i.name.slice(0, 127),
            sku: i.sku.slice(0, 127),
            quantity: String(i.quantity),
            category: "PHYSICAL_GOODS",
            ...(i.description ? { description: i.description.slice(0, 127) } : {}),
            unit_amount: { currency_code: input.currency, value: toPayPalValue(i.unit_cents, input.currency) },
          })),
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: input.shopName.slice(0, 127),
            user_action: "PAY_NOW",
            shipping_preference: "GET_FROM_FILE",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    },
  });
  const approveUrl = order.links?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!approveUrl) throw new Error("PayPal did not return an approval link");
  return { id: order.id, approveUrl };
}

export async function getOrder(id: string) {
  if (id.startsWith("MOCK-")) return { id, status: "APPROVED" } as PayPalOrder;
  return pp<PayPalOrder>(`/v2/checkout/orders/${id}`);
}

export async function captureOrder(id: string) {
  if (id.startsWith("MOCK-")) {
    return {
      id,
      status: "COMPLETED",
      payer: { name: { given_name: "Sandbox", surname: "Buyer" }, email_address: "buyer@example.com" },
      purchase_units: [{ payments: { captures: [{ id: `CAP-${id.slice(5)}`, status: "COMPLETED" }] } }],
    } as PayPalOrder;
  }
  try {
    return await pp<PayPalOrder>(`/v2/checkout/orders/${id}/capture`, { method: "POST", body: {}, requestId: `capture-${id}` });
  } catch (e) {
    if (e instanceof PayPalError && JSON.stringify(e.body).includes("ORDER_ALREADY_CAPTURED")) return getOrder(id);
    throw e;
  }
}

export async function refundCapture(captureId: string, note: string) {
  if (captureId.startsWith("CAP-")) return { id: `REF-${captureId.slice(4)}`, status: "COMPLETED" };
  return pp<{ id: string; status: string }>(`/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    requestId: `refund-${captureId}`,
    body: { note_to_payer: note.slice(0, 255) },
  });
}

export async function addTracking(orderId: string, captureId: string, carrier: string, number: string) {
  if (orderId.startsWith("MOCK-")) return { ok: true };
  return pp(`/v2/checkout/orders/${orderId}/track`, {
    method: "POST",
    body: { capture_id: captureId, tracking_number: number, carrier: carrier.toUpperCase().replace(/\s+/g, "_"), notify_payer: true },
  });
}

export async function createCatalogProduct(p: { name: string; description: string; imageUrl?: string | null; homeUrl: string; ref: string }) {
  if (!paypalConfigured()) return `PROD-MOCK-${p.ref.toUpperCase()}`;
  const body: Record<string, unknown> = {
    name: p.name.slice(0, 127),
    description: (p.description || p.name).slice(0, 256),
    type: "PHYSICAL",
    home_url: p.homeUrl,
  };
  if (p.imageUrl?.startsWith("https://")) body.image_url = p.imageUrl;
  try {
    const res = await pp<{ id: string }>("/v1/catalogs/products", { method: "POST", body, requestId: `product-${p.ref}` });
    return res.id;
  } catch (e) {
    if (body.image_url) {
      delete body.image_url;
      const res = await pp<{ id: string }>("/v1/catalogs/products", { method: "POST", body, requestId: `product-noimg-${p.ref}` });
      return res.id;
    }
    throw e;
  }
}

export async function verifyWebhook(headers: Headers, event: unknown) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || !paypalConfigured()) return false;
  const res = await pp<{ verification_status: string }>("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: {
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event,
    },
  });
  return res.verification_status === "SUCCESS";
}
