import Link from "next/link";
import { headers } from "next/headers";
import { Footer, Header } from "@/components/header";
import { ProductArt } from "@/components/product-art";
import { CopyField } from "@/components/copy-field";
import { baseUrlFrom } from "@/lib/base-url";
import { listShops } from "@/lib/store";

export const dynamic = "force-dynamic";

const steps = [
  ["Paste what you already have", "Your website, your Instagram, or a photo of the menu on the wall. Shelf's AI reads it and drafts the catalogue: names, prices, descriptions, tags. It won't make up products or prices."],
  ["Check it and publish", "Fix anything it got wrong, then publish. Your products go into the PayPal catalogue and your shop gets its own MCP address that AI agents can connect to."],
  ["Agents find you and buy", "Someone asks Claude for \u201ca birthday cake in Bristol under \u00a340\u201d. The agent finds you, builds the order, and the buyer approves it in PayPal. You see it land live."],
];

export default async function Home() {
  const shops = (await listShops()).slice(0, 6);
  const base = baseUrlFrom(await headers());
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <section className="grid items-center gap-12 [&>*]:min-w-0 pb-16 pt-8 lg:grid-cols-[1.15fr_1fr] lg:pt-14">
          <div className="rise">
            <h1 className="display text-[2.9rem] font-semibold leading-[0.98] sm:text-7xl">
              Let AI agents shop at <span className="italic text-tomato">your</span> shop.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Big retailers already sell through Claude and ChatGPT. The bakery down the road can&apos;t. Shelf turns a small shop&apos;s website, Instagram or menu photo into a catalogue any AI agent can search and buy from, with checkout through PayPal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start" className="btn btn-tomato">Open your shop in a minute</Link>
              <Link href="/agent" className="btn btn-ghost">Watch an agent buy</Link>
            </div>
            <p className="mt-5 text-sm text-muted">Free to try. Buyers always approve in PayPal, so an agent can&apos;t spend anyone&apos;s money on its own.</p>
          </div>
          <div className="relative">
            <div className="rise rounded-2xl border border-line bg-card p-4 shadow-[0_20px_50px_-30px_rgba(40,25,10,.45)]" style={{ animationDelay: "120ms" }}>
              <p className="text-xs text-muted">You → your AI assistant</p>
              <p className="mt-1 rounded-xl bg-paper px-3 py-2 text-sm">Find a birthday cake in Bristol for Saturday, under £40.</p>
              <p className="mt-3 text-xs text-muted">Agent · searched 3 shops on Shelf</p>
              <div className="mt-1.5 flex gap-3 rounded-xl border border-line p-2.5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg"><ProductArt name="Birthday sponge, 8 inch" accent="#b45309" /></div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">Birthday sponge, 8 inch · <span className="mono font-normal">£38.00</span></p>
                  <p className="truncate text-muted">Fernhill Bakehouse, Bristol · collect or local delivery</p>
                </div>
              </div>
              <div className="btn btn-paypal mt-3 w-full !py-2 text-sm">Approve £38.00 in PayPal</div>
            </div>
            <div className="mt-6 px-2">
              <div className="flex items-end justify-around gap-2 px-4">
                {["#d9502b", "#1f4d3a", "#b45309", "#0f766e", "#191714"].map((c, i) => (
                  <div key={c} className="sway w-12 overflow-hidden rounded-t-md" style={{ height: 46 + ((i * 17) % 34), background: c, animationDelay: `${i * 0.4}s` }} />
                ))}
              </div>
              <div className="shelf-edge" />
            </div>
          </div>
        </section>

        <section className="border-t border-line py-16">
          <h2 className="display max-w-2xl text-4xl font-semibold leading-tight">From a menu photo to an agent-ready shop.</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <li key={t} className="tag p-6 pl-9">
                <span className="mono text-sm text-tomato">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-10 border-t border-line py-16 lg:grid-cols-2">
          <div>
            <h2 className="display text-4xl font-semibold leading-tight">Built so agents can&apos;t overspend.</h2>
            <ul className="mt-6 space-y-4 text-muted">
              <li><strong className="text-ink">The buyer approves every payment.</strong> Agents create a PayPal order; money only moves after the person approves it in PayPal.</li>
              <li><strong className="text-ink">Prices come from the shop.</strong> Agents send product IDs and quantities. Totals are worked out on the server from the shop&apos;s own prices and stock.</li>
              <li><strong className="text-ink">Owners stay in charge.</strong> Every search, checkout and payment shows up live. A copilot built on the PayPal Agent Toolkit adds tracking, issues refunds and answers &ldquo;what sold this week?&rdquo;</li>
            </ul>
          </div>
          <div className="min-w-0 rounded-2xl bg-ink p-6 text-card">
            <p className="text-sm text-card/70">One address covers every shop on Shelf</p>
            <div className="mt-3 [&_div]:border-white/15 [&_div]:bg-white/5"><CopyField value={`${base}/mcp`} /></div>
            <pre className="mono mt-5 overflow-x-auto text-[12.5px] leading-relaxed text-card/85">{`{
  "mcpServers": {
    "shelf": { "url": "${base}/mcp" }
  }
}`}</pre>
            <p className="mt-4 text-sm text-card/70">Tools: find_shops · search_all_products · search_products · create_checkout · get_order_status</p>
            <Link href="/agents" className="mt-5 inline-block text-sm underline underline-offset-4">How agents use Shelf →</Link>
          </div>
        </section>

        <section className="border-t border-line py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="display text-4xl font-semibold">On the shelf</h2>
            <Link href="/start" className="text-sm underline underline-offset-4">Add yours</Link>
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((s) => (
              <li key={s.id}>
                <Link href={`/s/${s.slug}`} className="group block rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-ink">
                  <p className="mono text-[11px] uppercase tracking-widest text-muted">{[s.city, s.country].filter(Boolean).join(" · ")}</p>
                  <h3 className="display mt-2 text-2xl font-semibold" style={{ color: s.accent }}>{s.name}</h3>
                  <p className="mt-1 text-sm text-muted">{s.tagline}</p>
                  <p className="mt-4 text-sm">{s.product_count} products · {s.currency}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
