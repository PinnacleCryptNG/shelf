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
  const ticker = products.filter((p) => byId.has(p.shop_id)).slice(0, 14).map((p) => ({ name: p.name, shop: byId.get(p.shop_id)!.name, price: formatMoney(p.price_cents, p.currency), stock: p.stock, image: p.image_url }));

  return (
    <>
      <Header />
      <LiveRefresh />
      <main>
        <section className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 lg:pt-16">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-end lg:gap-16 [&>*]:min-w-0">
            <h1 className="display text-[2.8rem] leading-[1] sm:text-[4rem] lg:text-[4.4rem] lg:whitespace-nowrap">
              <span className="line-mask"><span>Small shops,</span></span>
              <span className="line-mask"><span className="[animation-delay:90ms]">open to <span className="text-laser">AI agents</span>.</span></span>
            </h1>
            <div className="rise [animation-delay:200ms] lg:pb-2">
              <p className="max-w-md text-[17px] leading-relaxed text-muted">
                Shelf turns your website, Instagram or a photo of your menu into a catalogue that Claude, ChatGPT and other agents can search and buy from. The buyer approves every payment in PayPal.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/start" className="btn btn-tomato">Open your shop</Link>
                <Link href="/agent" className="btn btn-ghost">Watch an agent buy</Link>
              </div>
            </div>
          </div>
          <div className="rise mt-12 [animation-delay:260ms] lg:mt-16">
            <AgentScene items={scene} shopCount={shopsLive.size} productCount={live.length} />
          </div>
        </section>

        <div className="mt-14"><Ticker items={ticker} /></div>

        <section className="mx-auto w-full max-w-6xl px-5 pt-28 sm:px-8">
          <Reveal className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div><span className="aisle"><b>01</b><span>How it works</span></span>
            <h2 className="display mt-5 max-w-2xl text-[2.3rem] leading-[1.02] sm:text-[3rem]">From a menu photo to a shop agents can buy from.</h2></div>
            <p className="max-w-xs text-[15px] leading-relaxed text-muted">No code and no new website. Most shops are live in a few minutes.</p>
          </Reveal>
          <ol className="mt-14 grid gap-14 md:grid-cols-3 md:gap-10">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 110} className="flex flex-col">
                <div className="on-shelf"><StepArt i={i} /></div>
                <p className="mt-7 flex items-baseline gap-3"><span className="text-[13px] font-semibold text-laser">{s.n}</span><span className="text-[19px] font-semibold tracking-tight">{s.t}</span></p>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="mt-32 bg-graphite text-[#f4f3ee]">
          <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center [&>*]:min-w-0">
            <Reveal>
              <span className="aisle light"><b>02</b><span>Guardrails</span></span>
              <h2 className="display mt-5 text-[2.3rem] leading-[1.02] sm:text-[3rem]">Built so agents can&apos;t overspend.</h2>
              <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                {rails.map(([t, d]) => (
                  <li key={t} className="border-t border-white/15 pt-4"><p className="font-semibold">{t}</p><p className="mt-1.5 text-[14.5px] leading-relaxed text-white/60">{d}</p></li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={150} className="mx-auto w-full max-w-sm">
              <div className="perf-top relative bg-[#fbfaf6] px-6 pb-6 pt-8 text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)]">
                <p className="text-center text-[12px] font-semibold uppercase tracking-[.2em]">Kiln &amp; Tide · Lisbon</p>
                <p className="mt-1 text-center text-[12px] text-muted">Order via Claude · ord_kuftYk</p>
                <ul className="mt-6 space-y-3 border-t border-dashed border-line pt-5 text-[14px]">
                  {[["Agent searched 4 shops", "0.4s"], ["Basket re-priced on server", "€32.00"], ["Stock held", "1 of 11"], ["Buyer approved in PayPal", "you"], ["Captured and recorded", "PAID"]].map(([a, b], k) => (
                    <li key={a} className="tick flex items-center justify-between gap-3" style={{ animationDelay: `${300 + k * 260}ms` }}>
                      <span className="flex items-center gap-2.5"><span className="grid h-4 w-4 place-items-center rounded-[4px] bg-moss text-[10px] text-white">✓</span>{a}</span>
                      <span className="mono text-muted">{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex justify-between border-t border-dashed border-line pt-4 text-[16px] font-semibold"><span>Total</span><span className="mono">€32.00</span></div>
                <div className="barcode mt-6 text-ink/85" />
                <span className="tick stamp absolute right-5 top-16 rotate-[-8deg] rounded-md border-2 border-moss px-2 py-0.5 text-[13px] font-bold tracking-[.2em] text-moss" style={{ animationDelay: "1700ms" }}>PAID</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 pt-28 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-center [&>*]:min-w-0">
          <Reveal>
            <span className="aisle"><b>03</b><span>For agents</span></span>
            <h2 className="display mt-5 text-[2.3rem] leading-[1.02] sm:text-[3rem]">One address. Every shop.</h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted">Add Shelf to Claude, ChatGPT, Cursor or any MCP client. Agents can search every shop, check stock and build a PayPal order for the buyer to approve.</p>
            <Link href="/agents" className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold underline-offset-4 hover:underline">Read the agent guide <span aria-hidden>→</span></Link>
          </Reveal>
          <Reveal delay={120}>
            <div className="panel p-5">
              <CopyField value={`${base}/mcp`} />
              <pre className="mono mt-4 overflow-x-auto rounded-[10px] bg-paper p-4 text-[12.5px] leading-relaxed">{`{
  "mcpServers": {
    "shelf": { "url": "${base}/mcp" }
  }
}`}</pre>
              <div className="mt-4 flex flex-wrap gap-2 text-[12.5px]">
                {["find_shops", "search_all_products", "search_products", "get_shop_info", "create_checkout", "get_order_status"].map((t) => (
                  <span key={t} className="mono rounded-[6px] border border-line px-2.5 py-1.5 text-ink/75">{t}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pt-28 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div><span className="aisle"><b>05</b><span>Open now</span></span><h2 className="display mt-5 text-[2.3rem] leading-[1.02] sm:text-[3rem]">On the shelf today</h2></div>
            <Link href="/start" className="text-sm font-semibold underline-offset-4 hover:underline">Add your shop →</Link>
          </Reveal>
          <ul className="mt-10 border-t border-line">
            {shops.slice(0, 6).map((s, i) => {
              const own = products.filter((p) => p.shop_id === s.id).slice(0, 4);
              return (
                <Reveal as="li" key={s.id} delay={i * 60} className="border-b border-line">
                  <Link href={`/s/${s.slug}`} className="group grid gap-5 py-7 md:grid-cols-[260px_1fr] md:gap-10 [&>*]:min-w-0">
                    <div className="flex flex-col">
                      <p className="label">{[s.city, s.country].filter(Boolean).join(" · ")}</p>
                      <h3 className="mt-2 text-[22px] font-semibold tracking-tight">{s.name}</h3>
                      <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-muted">{s.tagline}</p>
                      <p className="mt-auto flex items-center gap-4 pt-4 text-[13px]"><span className="text-muted">{s.product_count} products · {s.currency}</span><span className="font-semibold transition group-hover:translate-x-0.5">Visit shop →</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {own.map((p) => (
                        <div key={p.id} className="min-w-0">
                          <div className="aspect-[4/3] overflow-hidden rounded-[6px] bg-card"><ProductArt name={p.name} accent={s.accent} image={p.image_url} className={`transition duration-700 group-hover:scale-[1.04] ${p.stock === 0 ? "grayscale" : ""}`} /></div>
                          <p className="mt-2 truncate text-[13px] font-medium">{p.name}</p>
                          <p className="mono flex justify-between gap-2 text-[11px] text-muted"><span>{formatMoney(p.price_cents, p.currency)}</span>{p.stock != null && <span className={p.stock === 0 ? "" : p.stock <= 3 ? "text-[#c2410c]" : "text-moss"}>{p.stock === 0 ? "sold out" : `${p.stock} left`}</span>}</p>
                        </div>
                      ))}
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pt-32 sm:px-8">
          <Reveal className="relative overflow-hidden rounded-[18px] border border-line bg-card px-6 py-16 text-center sm:px-12 sm:py-20">
            <div aria-hidden className="glow -right-24 -top-32 h-96 w-96" />
            <div aria-hidden className="swing mx-auto w-fit">
              <div className="mx-auto h-6 w-px bg-ink/40" />
              <div className="relative rounded-[6px] bg-ink px-5 py-2.5 text-[13px] font-bold uppercase tracking-[.3em] text-white"><span className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-card" /><span className="mt-1 block">Open</span></div>
            </div>
            <h2 className="display relative mx-auto mt-8 max-w-2xl text-[2.3rem] leading-[1.02] sm:text-[3.4rem]">Be where people shop now: inside their AI.</h2>
            <p className="relative mx-auto mt-4 max-w-md text-muted">Free to try. Your first agent-ready catalogue takes a few minutes.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/start" className="btn btn-tomato">Open your shop</Link>
              <Link href="/agent" className="btn btn-ghost">Try the agent</Link>
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
      <div className="grid h-44 grid-cols-[96px_1fr] gap-3 rounded-[12px] border border-line bg-card p-3">
        <div className="relative overflow-hidden rounded-[8px] bg-ink">
          <img src="/products/family-tray.webp" alt="" className="h-full w-full object-cover opacity-90" loading="lazy" />
          <span className="scan-y absolute inset-x-0 h-0.5 bg-laser shadow-[0_0_12px_2px_rgba(255,74,36,.8)]" />
        </div>
        <ul className="grid content-center gap-1.5 text-[12px]">
          {[["Adobo tacos", "CA$14.00"], ["Lumpia", "CA$9.00"], ["Ube tres leches", "CA$7.50"], ["Salsa macha jar", "CA$12.00"]].map(([n, p], k) => (
            <li key={n} className="tick flex justify-between gap-2 rounded-[6px] bg-paper px-2.5 py-1.5" style={{ animationDelay: `${400 + k * 220}ms` }}><span className="truncate font-medium">{n}</span><span className="mono text-muted">{p}</span></li>
          ))}
        </ul>
      </div>
    );
  if (i === 1)
    return (
      <div className="h-44 overflow-hidden rounded-[12px] border border-line bg-card text-[12px]">
        <div className="grid grid-cols-[1.3fr_.8fr_1.1fr] bg-paper px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[.1em] text-muted"><span>Product</span><span>Price</span><span>Market</span></div>
        {[["Tide mug", "€32.00", 8, 40, 78, "€8–19 · above"], ["Bud vase", "€18.00", 20, 30, 45, "€12–24 · on par"], ["Platter", "€55.00", 30, 10, 52, "€40–70 · on par"]].map(([n, p, l, r, m, t], k) => (
          <div key={k} className="grid grid-cols-[1.3fr_.8fr_1.1fr] items-center gap-2 border-t border-line px-3 py-2.5">
            <span className="truncate font-medium">{n}</span><span className="mono">{p}</span>
            <span><span className="relative block h-1.5 rounded-full bg-paper"><span className="absolute inset-y-0 rounded-full bg-[#cfccc0]" style={{ left: `${l}%`, right: `${r}%` }} /><span className="absolute -top-1 h-3.5 w-[3px] rounded-sm bg-laser" style={{ left: `${m}%` }} /></span><span className={`mt-1 block text-[10.5px] ${k === 0 ? "text-[#c2410c]" : "text-moss"}`}>{t}</span></span>
          </div>
        ))}
      </div>
    );
  return (
    <div className="relative h-44 rounded-[12px] border border-line bg-card p-4 text-[13px]">
      <div className="flex items-center gap-3"><img src="/products/tide-mug.webp" alt="" className="h-11 w-11 rounded-[8px] object-cover" loading="lazy" /><div><p className="font-semibold">Tide mug</p><p className="text-[12px] text-muted">Kiln &amp; Tide · picked by Claude</p></div></div>
      <div className="mt-3 flex justify-between border-t border-dashed border-line pt-2.5 font-semibold"><span>Total</span><span className="mono">€32.00</span></div>
      <div className="mt-3 rounded-[8px] bg-[#ffc439] py-2 text-center text-[12.5px] font-semibold text-[#0b1f44]">Approved in PayPal</div>
      <span className="tick absolute right-4 top-4 rotate-[-8deg] rounded-md border-2 border-moss px-1.5 text-[11px] font-bold tracking-[.2em] text-moss" style={{ animationDelay: "900ms" }}>PAID</span>
    </div>
  );
}
