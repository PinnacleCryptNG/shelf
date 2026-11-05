import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Footer, Header } from "@/components/header";
import { CopyField } from "@/components/copy-field";
import { Reveal } from "@/components/reveal";
import { baseUrlFrom } from "@/lib/base-url";
import { listShops } from "@/lib/store";

export const metadata: Metadata = { title: "For developers", description: "Connect any MCP-capable AI agent to every small shop on Shelf with one URL." };
export const dynamic = "force-dynamic";

const tools = [
  ["find_shops", "Find shops by what they sell, city or country.", "query, city?, country?"],
  ["search_all_products", "Search every shop's products, with an optional price cap and currency.", "query, max_price?, currency?"],
  ["get_shop_info", "Name, location, fulfilment and policies for one shop.", "shop"],
  ["search_products", "Products, prices and stock for one shop.", "shop, query?"],
  ["create_checkout", "Builds a PayPal order from product IDs and quantities. Returns an approval link and a server-side total.", "shop, items[], buyer_note?"],
  ["get_order_status", "CREATED → APPROVED → PAID → SHIPPED. Only call it paid when this says PAID.", "order_id"],
];

const flow = [
  ["Agent", "create_checkout", "Shelf prices the basket from the shop's own catalogue and opens a PayPal order."],
  ["Buyer", "approve_url", "A person reviews the order in PayPal and approves it. Agents can't do this step."],
  ["Shelf", "capture", "Shelf captures the payment, decrements stock and notifies the shop."],
  ["Agent", "get_order_status", "Returns PAID. Only now may the agent say the order is paid."],
];

export default async function Agents() {
  const base = baseUrlFrom(await headers());
  const shops = await listShops();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <section className="grid gap-10 pb-6 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16 [&>*]:min-w-0">
          <div className="rise">
            <h1 className="display text-[2.6rem] leading-[1.04] sm:text-[3.4rem]">Every small shop.<br />One MCP address.</h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">Shelf speaks the Model Context Protocol over streamable HTTP. Add one URL to Claude, ChatGPT, Cursor or your own agent and it can browse and buy from every shop here. No API key.</p>
            <div className="mt-8 max-w-xl"><CopyField label="Directory" value={`${base}/mcp`} /></div>
            <p className="mt-4 text-sm text-muted">Want to see it first? <Link href="/agent" className="font-semibold text-ink underline-offset-4 hover:underline">Watch the demo agent shop →</Link></p>
          </div>
          <div className="rise [animation-delay:120ms]">
            <div className="panel-dark p-5">
              <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="mono ml-3 text-[11px] text-white/40">claude_desktop_config.json</span></div>
              <pre className="mono mt-4 overflow-x-auto text-[12.5px] leading-[1.8] text-white/80">{`{
  "mcpServers": {
    "shelf": {
      "url": "${base}/mcp"
    }
  }
}`}</pre>
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="mono text-[11px] text-white/40">or one shop only</p>
                <p className="mono mt-1 truncate text-[12.5px] text-white/80">{base}/s/<span className="text-[#ff4a24]">{"{slug}"}</span>/mcp</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-20">
          <Reveal><h2 className="display text-[1.9rem] leading-tight sm:text-[2.3rem]">Tools</h2></Reveal>
          <Reveal className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
            {tools.map(([n, d, a], i) => (
              <div key={n} className={`grid gap-1.5 p-5 sm:grid-cols-[230px_1fr_220px] sm:gap-6 ${i ? "border-t border-line" : ""}`}>
                <p className="mono text-[13px] font-medium">{n}</p>
                <p className="text-[15px] text-muted">{d}</p>
                <p className="mono text-[11.5px] text-muted sm:text-right">{a}</p>
              </div>
            ))}
          </Reveal>
        </section>

        <section className="pt-20">
          <Reveal><h2 className="display text-[1.9rem] leading-tight sm:text-[2.3rem]">The payment rule</h2>
            <p className="mt-3 max-w-2xl text-muted">Agents never complete a payment. Totals always come from the shop&apos;s own prices, so a hidden instruction on a web page can&apos;t change what gets charged.</p></Reveal>
          <ol className="mt-8 grid gap-3 md:grid-cols-4">
            {flow.map(([who, step, d], i) => (
              <Reveal as="li" key={step} delay={i * 80} className={`relative rounded-2xl border p-5 ${who === "Buyer" ? "border-[#ffc439] bg-[#fff8e6]" : "border-line bg-card"}`}>
                <p className="label">{i + 1} · {who}</p>
                <p className="mono mt-3 text-[14px] font-medium">{step}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="pt-20">
          <Reveal><h2 className="display text-[1.9rem] leading-tight sm:text-[2.3rem]">Single-shop endpoints</h2>
            <p className="mt-3 max-w-2xl text-muted">Every shop also has its own MCP server, plus a <span className="mono text-ink">feed.json</span> and <span className="mono text-ink">llms.txt</span> for crawlers.</p></Reveal>
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {shops.map((s, i) => (
              <Reveal as="li" key={s.id} delay={i * 60} className="panel p-4">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <Link href={`/s/${s.slug}`} className="font-semibold hover:underline">{s.name}</Link>
                  <span className="label">{[s.city, s.country].filter(Boolean).join(" · ")}</span>
                </div>
                <CopyField value={`${base}/s/${s.slug}/mcp`} />
                <p className="mt-3 flex gap-4 text-[13px] text-muted"><a className="hover:text-ink" href={`/s/${s.slug}/feed.json`}>feed.json</a><a className="hover:text-ink" href={`/s/${s.slug}/llms.txt`}>llms.txt</a></p>
              </Reveal>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
