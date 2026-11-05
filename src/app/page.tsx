import Link from "next/link";
import { headers } from "next/headers";
import { AgentScene, type SceneItem } from "@/components/agent-scene";
import { LiveRefresh } from "@/components/live-refresh";
import { CopyField } from "@/components/copy-field";
import { Footer, Header } from "@/components/header";
import { ProductArt } from "@/components/product-art";
import { Reveal } from "@/components/reveal";
import { Ticker } from "@/components/ticker";
import { baseUrlFrom } from "@/lib/base-url";
import { listDirectoryProducts, listShops } from "@/lib/store";
import { formatMoney } from "@/lib/types";

export const dynamic = "force-dynamic";

const steps = [
  { n: "01", t: "Show us what you sell", d: "Paste your website or Instagram, or snap the menu on the wall. Shelf reads it and drafts every product and price. It never invents either." },
  { n: "02", t: "Check it, then publish", d: "Edit anything in one table, see how your prices compare with the market, and publish. Your products sync to PayPal and your shop gets its own agent address." },
  { n: "03", t: "Agents shop, people pay", d: "Someone asks their AI for a gift. The agent finds you, builds the order, and the buyer approves it in PayPal. You watch it land live." },
];

const rails = [
  ["The buyer approves every payment.", "Agents can create an order, never pay for one. Money moves only after a person approves it in PayPal."],
  ["Prices come from the shop.", "Agents send product IDs and quantities. Totals, stock and currency are worked out on the server."],
  ["Owners approve refunds.", "The copilot drafts tracking and refunds; nothing happens until the owner taps Approve."],
  ["Shop text is data, not orders.", "Descriptions can't instruct an agent. A hidden line on a page can't change what gets charged."],
];

export default async function Home() {
  const [shops, products] = await Promise.all([listShops(), listDirectoryProducts()]);
  const base = baseUrlFrom(await headers());
  const byId = new Map(shops.map((s) => [s.id, s]));
  const live = products.filter((p) => byId.has(p.shop_id));
  const shopsLive = new Set(live.map((p) => p.shop_id));
  const nice = (cents: number, cur: string) => {
    const major = cents / 100;
    const step = major < 20 ? 5 : major < 100 ? 10 : major < 1000 ? 50 : 1000;
    return formatMoney((Math.floor(major / step) + 1) * step * 100, cur).replace(/\.00$/, "");
  };
  const perShop = new Map<string, typeof live>();
  for (const p of live) if (p.stock !== 0) perShop.set(p.shop_id, [...(perShop.get(p.shop_id) || []), p]);
  const pool: typeof live = [];
  for (let i = 0; pool.length < 12 && i < 12; i++) for (const list of perShop.values()) if (list[i] && pool.length < 12) pool.push(list[i]);
  const scene: SceneItem[] = pool.map((p) => {
    const s = byId.get(p.shop_id)!;
    return { id: p.id, name: p.name, shop: s.name, city: s.city, price: formatMoney(p.price_cents, p.currency), under: nice(p.price_cents, p.currency), accent: s.accent, image: p.image_url, stock: p.stock };
  });
  const ticker = products.filter((p) => byId.has(p.shop_id)).slice(0, 14).map((p) => ({ name: p.name, shop: byId.get(p.shop_id)!.name, price: formatMoney(p.price_cents, p.currency), stock: p.stock }));

  return (
    <>
      <Header />
      <LiveRefresh />
      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-16 [&>*]:min-w-0">
          <div className="rise">
            <h1 className="display text-[2.7rem] leading-[1.02] sm:text-[3.6rem] lg:text-[4rem]">
              Small shops,<br />open to <span className="text-[#ff4a24]">AI agents</span>.
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted">
              Paste your website, Instagram or a photo of your menu. Shelf turns it into a catalogue Claude, ChatGPT and any MCP agent can search and buy from. Every payment is approved by the buyer in PayPal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/start" className="btn btn-tomato">Open your shop</Link>
              <Link href="/agent" className="btn btn-ghost">Watch an agent buy</Link>
            </div>
            <p className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
              <span>Works with</span>
              {["Claude", "ChatGPT", "Cursor", "any MCP client"].map((n) => <span key={n} className="font-semibold text-ink/70">{n}</span>)}
            </p>
          </div>
          <div className="rise [animation-delay:120ms]"><AgentScene items={scene} shopCount={shopsLive.size} productCount={live.length} /></div>
        </section>

        <Ticker items={ticker} />

        <section className="mx-auto w-full max-w-6xl px-5 pt-24 sm:px-8">
          <Reveal><h2 className="display max-w-xl text-[2.1rem] leading-[1.08] sm:text-[2.6rem]">From a menu photo to an agent-ready shop in minutes.</h2></Reveal>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 90} className="panel flex flex-col p-6">
                <StepArt i={i} />
                <span className="mono mt-6 text-[12px] text-[#ff4a24]">{s.n}</span>
                <h3 className="mt-1.5 text-[19px] font-semibold tracking-tight">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 pt-28 sm:px-8 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
          <Reveal>
            <h2 className="display text-[2.1rem] leading-[1.08] sm:text-[2.6rem]">Built so agents can&apos;t overspend.</h2>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {rails.map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[2.25rem_1fr] gap-2 py-5">
                  <span className="mono pt-0.5 text-[12px] text-muted">0{i + 1}</span>
                  <div><p className="font-semibold">{t}</p><p className="mt-1 text-[15px] leading-relaxed text-muted">{d}</p></div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="lg:pt-16">
            <div className="panel-dark p-6">
              <p className="text-sm text-white/60">One address covers every shop on Shelf</p>
              <div className="mt-3"><CopyField tone="dark" value={`${base}/mcp`} /></div>
              <pre className="mono mt-6 overflow-x-auto rounded-xl bg-black/30 p-4 text-[12px] leading-relaxed text-white/80">{`{
  "mcpServers": {
    "shelf": { "url": "${base}/mcp" }
  }
}`}</pre>
              <div className="mt-6 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-3">
                {["find_shops", "search_all_products", "search_products", "get_shop_info", "create_checkout", "get_order_status"].map((t) => (
                  <span key={t} className="mono truncate rounded-lg border border-white/10 px-2.5 py-2 text-white/70">{t}</span>
                ))}
              </div>
              <Link href="/agents" className="mt-6 inline-flex items-center gap-1.5 text-sm text-white underline-offset-4 hover:underline">Read the agent guide <span aria-hidden>→</span></Link>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pt-28 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-[2.1rem] leading-[1.08] sm:text-[2.6rem]">On the shelf today</h2>
            <Link href="/start" className="text-sm font-semibold underline-offset-4 hover:underline">Add your shop →</Link>
          </Reveal>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.slice(0, 6).map((s, i) => {
              const own = products.filter((p) => p.shop_id === s.id).slice(0, 3);
              return (
                <Reveal as="li" key={s.id} delay={i * 80}>
                  <Link href={`/s/${s.slug}`} className="group panel block overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgba(15,16,18,.35)]">
                    <div className="grid grid-cols-3 gap-px bg-line">
                      {own.map((p) => <div key={p.id} className="aspect-square overflow-hidden bg-card"><ProductArt name={p.name} accent={s.accent} image={p.image_url} className="transition duration-500 group-hover:scale-105" /></div>)}
                    </div>
                    <div className="p-5">
                      <p className="label">{[s.city, s.country].filter(Boolean).join(" · ")}</p>
                      <h3 className="mt-2 text-[20px] font-semibold tracking-tight">{s.name}</h3>
                      <p className="mt-1 line-clamp-1 text-sm text-muted">{s.tagline}</p>
                      <p className="mt-4 flex items-center justify-between text-[13px]"><span className="text-muted">{s.product_count} products · {s.currency}</span><span className="font-semibold transition group-hover:translate-x-0.5">Visit →</span></p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pt-28 sm:px-8">
          <Reveal className="panel-dark relative overflow-hidden px-6 py-14 text-center sm:px-12">
            <div className="dots pointer-events-none absolute inset-0 opacity-[.35] invert" />
            <h2 className="display relative mx-auto max-w-2xl text-[2.1rem] leading-[1.08] sm:text-[2.8rem]">Be where people shop now: inside their AI.</h2>
            <p className="relative mx-auto mt-4 max-w-md text-white/60">Free to try. No code. Your first agent-ready catalogue takes a few minutes.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/start" className="btn btn-tomato">Open your shop</Link>
              <Link href="/agent" className="btn border border-white/15 text-white hover:border-white/40">Try the agent</Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}

function StepArt({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="relative h-32 overflow-hidden rounded-xl bg-paper p-4">
        <div className="absolute left-4 top-4 h-24 w-20 rotate-[-4deg] rounded-md bg-card p-2 shadow-sm">
          {[70, 55, 80, 45, 62].map((w, k) => <div key={k} className="mb-1.5 h-1.5 rounded bg-ink/15" style={{ width: `${w}%` }} />)}
        </div>
        <div className="absolute left-[7.5rem] top-1/2 h-px w-8 -translate-y-1/2 bg-ink/30" />
        <div className="absolute right-4 top-4 space-y-1.5">
          {["Sourdough", "Croissant", "Rye loaf"].map((n, k) => (
            <div key={n} className="flex w-28 items-center justify-between rounded-md bg-card px-2 py-1 text-[10px] shadow-sm" style={{ animationDelay: `${k * 200}ms` }}>
              <span>{n}</span><span className="mono text-[9px] text-muted">£{[6.5, 3.2, 5.8][k].toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  if (i === 1)
    return (
      <div className="h-32 overflow-hidden rounded-xl bg-paper p-3">
        <div className="overflow-hidden rounded-lg border border-line bg-card text-[10px]">
          <div className="grid grid-cols-[1.4fr_.8fr_1fr] bg-paper px-2 py-1.5 font-semibold"><span>Product</span><span>Price</span><span>Market</span></div>
          {[["Tide mug", "32.00", "8–19 · above"], ["Bowl", "24.00", "on par"], ["Vase", "48.00", "no match"]].map((r, k) => (
            <div key={k} className={`grid grid-cols-[1.4fr_.8fr_1fr] border-t border-line px-2 py-1.5 ${k === 0 ? "bg-[#ff4a24]/5" : ""}`}>
              <span>{r[0]}</span><span className={`mono ${k === 0 ? "rounded ring-1 ring-[#ff4a24]" : ""} w-fit px-0.5`}>{r[1]}</span><span className="text-muted">{r[2]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <div className="relative h-32 overflow-hidden rounded-xl bg-paper p-4">
      <div className="mx-auto w-40 rounded-t-md bg-card p-3 text-[10px] shadow-sm">
        <div className="flex justify-between"><span>1 × Tide mug</span><span className="mono">€32</span></div>
        <div className="mt-1.5 border-t border-dashed border-line pt-1.5 font-semibold">Total €32.00</div>
        <div className="mt-2 rounded bg-[#ffc439] py-1 text-center text-[9px] font-semibold text-[#0b1f44]">Approved in PayPal</div>
      </div>
      <span className="absolute right-6 top-6 rotate-[-8deg] rounded border-2 border-moss px-1.5 text-[11px] font-bold tracking-widest text-moss">PAID</span>
    </div>
  );
}
