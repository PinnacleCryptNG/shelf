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
      <Header right={<><Link href={`/s/${shop.slug}/dashboard`} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink">Shop dashboard</Link><Link href="/start" className="btn btn-ghost ml-1 hidden !px-3.5 !py-2 text-[14px] sm:inline-flex">Open your shop</Link></>} />
      <main className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <section className="rise relative grid gap-8 overflow-hidden rounded-[28px] border border-line bg-card p-6 sm:p-10 md:grid-cols-[1.35fr_1fr] md:items-end [&>*]:min-w-0">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[.12] blur-3xl" style={{ background: shop.accent }} />
          <div className="relative">
            <p className="label">{[shop.city, shop.country].filter(Boolean).join(" · ")}</p>
            <h1 className="display mt-3 text-[2.6rem] leading-[1.02] sm:text-[3.5rem]">{shop.name}</h1>
            <p className="mt-3 text-xl text-ink/80">{shop.tagline}</p>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">{shop.about}</p>
            <p className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm"><span><span className="text-muted">Fulfilment</span> · {shop.ships_to}</span><span><span className="text-muted">Prices in</span> · {shop.currency}</span></p>
          </div>
          <div className="relative rounded-2xl bg-paper p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-[#ff4a24]" />Shopping with an AI assistant?</p>
            <p className="mb-3 mt-1 text-sm text-muted">Add this shop to Claude, ChatGPT or any MCP client, then just ask.</p>
            <CopyField value={`${base}/s/${shop.slug}/mcp`} />
            <p className="mt-2.5 text-xs text-muted">Also as <a className="underline underline-offset-2 hover:text-ink" href={`/s/${shop.slug}/llms.txt`}>llms.txt</a> and <a className="underline underline-offset-2 hover:text-ink" href={`/s/${shop.slug}/feed.json`}>feed.json</a></p>
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
