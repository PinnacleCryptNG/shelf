import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { aiProvider } from "@/lib/ai";
import { baseUrlFrom } from "@/lib/base-url";
import { canView, isOwner } from "@/lib/owner";
import { paypalConfigured } from "@/lib/paypal";
import { expireStaleCheckouts, getShop, listEvents, listOrders, listProducts, redactEvents, redactOrder } from "@/lib/store";
import { Dashboard } from "./dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop dashboard", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const shop = await getShop((await params).slug);
  if (!shop) notFound();
  if (!(await canView(shop))) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-5 pt-16 text-center">
          <h1 className="display text-3xl font-semibold">Owners only</h1>
          <p className="mt-2 text-muted">Open your private owner link, or this page on the device you created the shop on.</p>
          <Link href={`/s/${shop.slug}`} className="btn btn-ghost mt-6">Visit the shop</Link>
        </main>
      </>
    );
  }
  const owner = await isOwner(shop);
  await expireStaleCheckouts(shop.id);
  const [orders, events, products] = await Promise.all([listOrders(shop.id), listEvents(shop.id), listProducts(shop.id, true)]);
  const base = baseUrlFrom(await headers());
  return (
    <>
      <Header right={<Link href={`/s/${shop.slug}`} className="btn btn-ghost !px-4 !py-2 text-sm">View shop</Link>} />
      <Dashboard
        shop={{ slug: shop.slug, name: shop.name, currency: shop.currency, accent: shop.accent, is_demo: shop.is_demo }}
        mcpUrl={`${base}/s/${shop.slug}/mcp`}
        initialOrders={owner ? orders : orders.map(redactOrder)}
        initialEvents={owner ? events : redactEvents(events, orders)}
        products={products.map((p) => ({ id: p.id, name: p.name, price_cents: p.price_cents, stock: p.stock, synced: Boolean(p.paypal_product_id) }))}
        aiReady={aiProvider() !== null}
        paypalLive={paypalConfigured()}
        readOnly={!owner}
        ownerLink={owner && !shop.is_demo ? `${base}/s/${shop.slug}/owner?key=${shop.owner_key}` : null}
      />
    </>
  );
}
