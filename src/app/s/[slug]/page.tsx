import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Header } from "@/components/header";
import { CopyField } from "@/components/copy-field";
import { baseUrlFrom } from "@/lib/base-url";
import { getShop, listProducts } from "@/lib/store";
import { Basket } from "./basket";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const shop = await getShop((await params).slug);
  return shop ? { title: shop.name, description: shop.tagline } : {};
}

export default async function Storefront({ params }: { params: Promise<{ slug: string }> }) {
  const shop = await getShop((await params).slug);
  if (!shop?.published) notFound();
  const products = await listProducts(shop.id);
  const base = baseUrlFrom(await headers());
  const categories = [...new Set(products.map((p) => p.category))];
  return (
    <>
      <Header right={<Link href={`/s/${shop.slug}/dashboard`} className="rounded-full px-3 py-2 text-sm hover:bg-card">Owner</Link>} />
      <main className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <section className="rise grid gap-8 [&>*]:min-w-0 border-b border-line pb-10 pt-6 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <p className="mono mb-3 text-xs uppercase tracking-widest text-muted">{[shop.city, shop.country].filter(Boolean).join(" · ")}</p>
            <h1 className="display text-5xl font-semibold leading-[1.02] sm:text-6xl" style={{ color: shop.accent }}>{shop.name}</h1>
            <p className="display mt-3 text-2xl text-ink/80">{shop.tagline}</p>
            <p className="mt-4 max-w-xl text-muted">{shop.about}</p>
            <p className="mt-3 text-sm"><span className="text-muted">Fulfilment:</span> {shop.ships_to}</p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-4">
            <p className="text-sm font-semibold">Shopping with an AI assistant?</p>
            <p className="mb-3 mt-1 text-sm text-muted">Add this shop to Claude, ChatGPT or any MCP client and just ask for what you want.</p>
            <CopyField value={`${base}/s/${shop.slug}/mcp`} />
            <p className="mt-2 text-xs text-muted">Also available as <a className="underline" href={`/s/${shop.slug}/llms.txt`}>llms.txt</a> and <a className="underline" href={`/s/${shop.slug}/feed.json`}>feed.json</a>.</p>
          </div>
        </section>
        <Basket
          slug={shop.slug}
          accent={shop.accent}
          categories={categories}
          products={products.map((p) => ({ id: p.id, name: p.name, description: p.description, price_cents: p.price_cents, currency: p.currency, category: p.category, image_url: p.image_url, stock: p.stock }))}
        />
      </main>
      <Footer />
    </>
  );
}
