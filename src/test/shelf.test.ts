import { localPhoto } from "@/lib/photos";
import { beforeAll, describe, expect, it } from "vitest";
import { sql } from "@/lib/db";
import { hit } from "@/lib/guard";
import { isPrivateAddress } from "@/lib/importer";
import {
  CheckoutError, createCheckout, getOrderRow, getProduct, getShop, listProducts, rankProducts, recordExternalRefund, redactEvents, settlePayPalOrder,
} from "@/lib/store";
import type { Shop } from "@/lib/types";

let shop: Shop;
const base = "http://localhost:3000";

async function setStock(id: string, stock: number | null) {
  await sql("update products set stock = $2 where id = $1", [id, stock]);
}

beforeAll(async () => {
  await sql(
    `insert into shops (id, slug, name, currency, owner_key, published) values ('shop_test', 'test-shop', 'Test Shop', 'EUR', 'k', true)
     on conflict do nothing`,
  );
  await sql(
    `insert into products (id, shop_id, name, price_cents, currency, category, tags, stock) values
     ('p_mug', 'shop_test', 'Stoneware mug', 3200, 'EUR', 'Mugs', '{handmade,mug}', 5),
     ('p_bowl', 'shop_test', 'Breakfast bowl', 2400, 'EUR', 'Bowls', '{bowl}', null)
     on conflict do nothing`,
  );
  shop = (await getShop("test-shop"))!;
});

const checkout = (items: { product_id: string; quantity: number }[]) =>
  createCheckout({ shop, items, channel: "agent", agentName: "Test agent", base });

describe("checkout validation", () => {
  it("rejects unknown products", async () => {
    await expect(checkout([{ product_id: "p_nope", quantity: 1 }])).rejects.toBeInstanceOf(CheckoutError);
  });

  it("counts repeated lines against stock", async () => {
    await setStock("p_mug", 5);
    await expect(checkout([{ product_id: "p_mug", quantity: 3 }, { product_id: "p_mug", quantity: 3 }])).rejects.toThrow(/Only 5 left/);
  });

  it("prices from the database, not the caller", async () => {
    const out = await checkout([{ product_id: "p_mug", quantity: 2 }]);
    expect(out.total).toContain("64");
  });
});

describe("settlement", () => {
  it("captures once and takes stock once, even when called concurrently", async () => {
    await setStock("p_mug", 5);
    const out = await checkout([{ product_id: "p_mug", quantity: 2 }]);
    const results = await Promise.all([1, 2, 3].map(() => settlePayPalOrder(out.paypal_order_id)));
    expect(results.some((r) => r?.status === "PAID")).toBe(true);
    expect((await getOrderRow(out.order_id))?.status).toBe("PAID");
    expect((await getProduct("p_mug"))?.stock).toBe(3);
    await settlePayPalOrder(out.paypal_order_id);
    expect((await getProduct("p_mug"))?.stock).toBe(3);
  });

  it("does not oversell the last item", async () => {
    await setStock("p_mug", 1);
    const a = await checkout([{ product_id: "p_mug", quantity: 1 }]);
    const b = await checkout([{ product_id: "p_mug", quantity: 1 }]);
    await settlePayPalOrder(a.paypal_order_id);
    await settlePayPalOrder(b.paypal_order_id);
    expect((await getOrderRow(a.order_id))?.status).toBe("PAID");
    expect((await getOrderRow(b.order_id))?.status).toBe("CANCELLED");
    expect((await getOrderRow(b.order_id))?.capture_id).toBeNull();
    expect((await getProduct("p_mug"))?.stock).toBe(0);
  });

  it("never captures a cancelled order", async () => {
    await setStock("p_mug", 5);
    const out = await checkout([{ product_id: "p_mug", quantity: 1 }]);
    await sql("update orders set status = 'CANCELLED' where id = $1", [out.order_id]);
    const after = await settlePayPalOrder(out.paypal_order_id);
    expect(after?.status).toBe("CANCELLED");
    expect(after?.capture_id).toBeNull();
    expect((await getProduct("p_mug"))?.stock).toBe(5);
  });

  it("records refunds made in PayPal", async () => {
    const out = await checkout([{ product_id: "p_bowl", quantity: 1 }]);
    await settlePayPalOrder(out.paypal_order_id);
    await recordExternalRefund(out.paypal_order_id, "REF-1");
    expect((await getOrderRow(out.order_id))?.status).toBe("REFUNDED");
  });
});

describe("search", () => {
  it("ranks by name, tags and price", async () => {
    const products = await listProducts(shop.id);
    expect(rankProducts(products, "handmade mug")[0]?.id).toBe("p_mug");
    expect(rankProducts(products, "", 2500).map((p) => p.id)).toEqual(["p_bowl"]);
  });
});

describe("importer address checks", () => {
  it.each(["127.0.0.1", "10.1.2.3", "169.254.169.254", "192.168.0.1", "100.64.0.1", "::1", "fd00::1", "::ffff:127.0.0.1", "0.0.0.0", "not-an-ip"])(
    "blocks %s",
    (a) => expect(isPrivateAddress(a)).toBe(true),
  );
  it.each(["93.184.216.34", "2606:4700::6810:84e5"])("allows %s", (a) => expect(isPrivateAddress(a)).toBe(false));
});

describe("rate limits", () => {
  it("allows up to the limit in a window", async () => {
    const r = [];
    for (let i = 0; i < 4; i++) r.push(await hit("test:ip", 3, 60));
    expect(r).toEqual([true, true, true, false]);
  });
});

describe("public dashboard redaction", () => {
  it("hides buyer surnames in activity", () => {
    const order = { buyer_name: "John Doe", buyer_email: "j@x.com" } as Parameters<typeof redactEvents>[1][number];
    const [e] = redactEvents([{ id: 1, shop_id: "s", kind: "paid", actor: "paypal", summary: "John Doe paid €32.00 with PayPal", data: { capture_id: "C" }, created_at: "" }], [order]);
    expect(e.summary).toBe("John D. paid €32.00 with PayPal");
    expect(e.data).toBeNull();
  });
});

describe("product photos", () => {
  it("matches real photos for known products", () => {
    expect(localPhoto("Adobo tacos")).toBe("/products/adobo-tacos.webp");
    expect(localPhoto("Matcha starter kit")).toBe("/products/matcha-kit.webp");
    expect(localPhoto("Sourdough starter")).toBe("/products/sourdough-starter.webp");
    expect(localPhoto("Family tray", true)).toBeNull();
    expect(localPhoto("Family tray")).toBe("/products/family-tray.webp");
    expect(localPhoto("Bundle of joy")).toBeNull();
    expect(localPhoto("Chicken adobo bowl", false, "Mains")).toBeNull();
    expect(localPhoto("Breakfast bowl", false, "Tableware")).toBe("/products/breakfast-bowls.webp");
  });
});
