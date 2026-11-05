import type { Metadata } from "next";
import { headers } from "next/headers";
import { Footer, Header } from "@/components/header";
import { CopyField } from "@/components/copy-field";
import { baseUrlFrom } from "@/lib/base-url";
import { listShops } from "@/lib/store";

export const metadata: Metadata = { title: "For agents", description: "Connect any MCP-capable AI agent to every small shop on Shelf." };
export const dynamic = "force-dynamic";

const tools = [
  ["find_shops", "Find shops by what they sell, city or country."],
  ["search_all_products", "Search every shop's products, with an optional price cap and currency."],
  ["get_shop_info / search_products", "Details and products for one shop."],
  ["create_checkout", "Send product IDs and quantities. Returns a PayPal approval link for the buyer and a total worked out on the server."],
  ["get_order_status", "CREATED → PAID → SHIPPED. Only call it paid when this tool says PAID."],
];

export default async function Agents() {
  const base = baseUrlFrom(await headers());
  const shops = await listShops();
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl px-5 sm:px-8">
        <h1 className="display rise pt-6 text-5xl font-semibold leading-tight">Every small shop, one MCP address.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">Shelf speaks the Model Context Protocol over streamable HTTP. Add one URL to Claude, ChatGPT, Cursor or your own agent and it can browse and buy from every shop here. No API key needed.</p>
        <div className="mt-8 max-w-2xl"><CopyField label="Directory" value={`${base}/mcp`} /></div>
        <h2 className="display mt-14 text-2xl font-semibold">Tools</h2>
        <dl className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
          {tools.map(([n, d]) => (
            <div key={n} className="grid gap-1 p-4 sm:grid-cols-[230px_1fr]"><dt className="mono text-sm">{n}</dt><dd className="text-sm text-muted">{d}</dd></div>
          ))}
        </dl>
        <h2 className="display mt-14 text-2xl font-semibold">The payment rule</h2>
        <p className="mt-3 text-muted">Agents never complete payment. <span className="mono text-ink">create_checkout</span> returns an <span className="mono text-ink">approve_url</span>; the human buyer approves in PayPal and Shelf captures the payment. Totals always come from the shop&apos;s own prices, so a hidden instruction on a web page can&apos;t change what gets charged.</p>
        <h2 className="display mt-14 text-2xl font-semibold">Single-shop endpoints</h2>
        <ul className="mt-4 space-y-3">
          {shops.map((s) => (
            <li key={s.id} className="rounded-xl border border-line bg-card p-3">
              <p className="mb-2 text-sm font-semibold">{s.name} <span className="font-normal text-muted">· {s.city}, {s.country}</span></p>
              <CopyField value={`${base}/s/${s.slug}/mcp`} />
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
