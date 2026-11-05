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
        <main className="mx-auto flex max-w-md flex-col items-center px-5 pb-24 pt-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink text-white" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
          </span>
          <h1 className="display mt-6 text-[2.2rem] leading-tight">Owners only</h1>
          <p className="mt-3 text-muted">Open your private owner link, or this page on the device you created the shop on.</p>
          <Link href={`/s/${shop.slug}`} className="btn btn-ink mt-8">Visit {shop.name}</Link>
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
      <Header right={<Link href={`/s/${shop.slug}`} className="btn btn-ghost !px-3.5 !py-2 text-[14px]">View shop</Link>} />
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
