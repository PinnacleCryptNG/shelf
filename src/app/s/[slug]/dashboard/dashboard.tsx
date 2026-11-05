"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { CopyField } from "@/components/copy-field";
import { ProductsGrid } from "@/components/products-grid";
import { formatMoney, type Order, type ShopEvent } from "@/lib/types";

type P = { id: string; name: string; price_cents: number; stock: number | null; synced: boolean };
type ShopLite = { slug: string; name: string; currency: string; accent: string; is_demo: boolean };

const badge: Record<string, string> = {
  CREATED: "bg-paper text-muted", APPROVED: "bg-amber-100 text-amber-900", PAID: "bg-emerald-100 text-emerald-900",
  SHIPPED: "bg-sky-100 text-sky-900", REFUNDED: "bg-rose-100 text-rose-900", CANCELLED: "bg-paper text-muted line-through",
};
const dot: Record<string, string> = { search: "bg-wood", checkout: "bg-tomato", paid: "bg-moss", shipped: "bg-sky-600", refunded: "bg-rose-600", published: "bg-ink" };

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`;
}

export function Dashboard({ shop, mcpUrl, initialOrders, initialEvents, products: initialProducts, aiReady, paypalLive }: {
  shop: ShopLite; mcpUrl: string; initialOrders: Order[]; initialEvents: ShopEvent[]; products: P[]; aiReady: boolean; paypalLive: boolean;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [events, setEvents] = useState(initialEvents);
  const [products, setProducts] = useState(initialProducts);
  const [fresh, setFresh] = useState<number | null>(null);
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const last = useRef(initialEvents[0]?.id || 0);

  useEffect(() => {
    const t = setInterval(async () => {
      const r = await fetch(`/api/shops/${shop.slug}/events`, { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { events: ShopEvent[]; orders: Order[]; products?: P[] };
      setOrders(j.orders);
      setEvents(j.events);
      if (j.products) setProducts(j.products);
      if (j.events[0] && j.events[0].id > last.current) { setFresh(j.events[0].id); last.current = j.events[0].id; }
    }, 2500);
    return () => clearInterval(t);
  }, [shop.slug]);

  const sold = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of orders) if (["PAID", "SHIPPED"].includes(o.status)) for (const i of o.items) m[i.product_id] = (m[i.product_id] || 0) + i.quantity;
    return m;
  }, [orders]);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => ["PAID", "SHIPPED"].includes(o.status));
    const agent = paid.filter((o) => o.channel === "agent");
    return {
      revenue: formatMoney(paid.reduce((a, o) => a + o.total_cents, 0), shop.currency),
      agentShare: paid.length ? Math.round((agent.length / paid.length) * 100) : 0,
      paid: paid.length,
      searches: events.filter((e) => e.kind === "search").length,
    };
  }, [orders, events, shop.currency]);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8">
      <div className="rise flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <p className="mono text-xs uppercase tracking-widest text-muted">Dashboard{!paypalLive && " · PayPal mock mode"}</p>
          <h1 className="display mt-1 text-4xl font-semibold" style={{ color: shop.accent }}>{shop.name}</h1>
        </div>
        <div className="w-full max-w-md"><CopyField label="Agents connect at" value={mcpUrl} /></div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Paid revenue", stats.revenue], ["Paid orders", String(stats.paid)], ["Bought by agents", `${stats.agentShare}%`], ["Agent searches", String(stats.searches)]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-line bg-card p-4"><p className="text-xs text-muted">{k}</p><p className="display mt-1 text-2xl font-semibold">{v}</p></div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="min-w-0">
          <div className="mb-4 inline-flex rounded-full border border-line bg-card p-1 text-sm">
            {(["orders", "products"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 capitalize ${tab === t ? "bg-ink text-card" : ""}`}>{t}</button>)}
          </div>
          {tab === "orders" ? (
            orders.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">No orders yet. Point an agent at your MCP address, or try the <a href="/agent" className="underline">demo agent</a>.</p> : (
              <ul className="space-y-3">{orders.map((o) => <OrderRow key={o.id} o={o} slug={shop.slug} onChange={(u) => setOrders((os) => os.map((x) => (x.id === u.id ? u : x)))} />)}</ul>
            )
          ) : (
            <ProductsGrid currency={shop.currency} rows={products.map((p) => ({ ...p, sold: sold[p.id] || 0 }))} />
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-line bg-card">
            <p className="border-b border-line px-4 py-3 text-sm font-semibold">Live activity</p>
            <ul className="max-h-80 overflow-y-auto">
              {events.length === 0 && <li className="p-4 text-sm text-muted">Quiet so far.</li>}
              {events.slice(0, 40).map((e) => (
                <li key={e.id} className={`flex gap-3 px-4 py-2.5 text-sm ${e.id === fresh ? "rise bg-tomato/5" : ""}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[e.kind] || "bg-muted"} ${e.id === fresh ? "ping" : ""}`} />
                  <span className="min-w-0"><span className="block">{e.summary}</span><span className="text-xs text-muted">{e.actor} · {ago(e.created_at)}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <Copilot slug={shop.slug} aiReady={aiReady} />
        </aside>
      </div>
    </main>
  );
}

function OrderRow({ o, slug, onChange }: { o: Order; slug: string; onChange: (o: Order) => void }) {
  const [open, setOpen] = useState<"ship" | null>(null);
  const [carrier, setCarrier] = useState("ROYAL_MAIL");
  const [num, setNum] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function act(body: object) {
    setBusy(true); setErr(null);
    const r = await fetch(`/api/shops/${slug}/orders/${o.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error);
    onChange(j.order); setOpen(null);
  }
  return (
    <li className="tag p-4 pl-8">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{o.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}</p>
          <p className="mt-0.5 text-sm text-muted">
            {o.channel === "agent" ? <>via <strong className="text-ink">{o.agent_name || "AI agent"}</strong></> : "via storefront"}
            {o.buyer_name && <> · {o.buyer_name}</>} · {ago(o.created_at)}
          </p>
          {o.note && <p className="mt-1 text-sm italic">&ldquo;{o.note}&rdquo;</p>}
          {o.tracking && <p className="mono mt-1 text-xs">{o.tracking.carrier} {o.tracking.number}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="mono">{formatMoney(o.total_cents, o.currency)}</span>
          <span className={`mono rounded-full px-2 py-0.5 text-[10px] ${badge[o.status]}`}>{o.status}</span>
        </div>
      </div>
      {o.status === "PAID" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setOpen(open ? null : "ship")} className="btn btn-ghost !px-3 !py-1.5 text-sm">Add tracking</button>
          <button disabled={busy} onClick={() => confirm(`Refund ${formatMoney(o.total_cents, o.currency)} through PayPal?`) && act({ action: "refund" })} className="btn btn-ghost !px-3 !py-1.5 text-sm">Refund</button>
        </div>
      )}
      {open === "ship" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <select className="field !w-auto" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {["ROYAL_MAIL", "DHL", "UPS", "FEDEX", "USPS", "JAPAN_POST", "CTT", "OTHER"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="field !w-48" placeholder="Tracking number" value={num} onChange={(e) => setNum(e.target.value)} />
          <button disabled={busy || num.length < 3} onClick={() => act({ action: "ship", carrier, number: num })} className="btn btn-ink !py-2 text-sm">Save to PayPal</button>
        </div>
      )}
      {err && <p className="mt-2 text-sm text-tomato">{err}</p>}
    </li>
  );
}

function Copilot({ slug, aiReady }: { slug: string; aiReady: boolean }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: `/api/copilot/${slug}` }), [slug]);
  const { messages, sendMessage, status } = useChat({ transport });
  const [input, setInput] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [messages]);
  const busy = status === "submitted" || status === "streaming";
  const ask = (t: string) => { if (t.trim() && !busy) { sendMessage({ text: t }); setInput(""); } };
  return (
    <div className="rounded-2xl bg-ink text-card">
      <p className="border-b border-white/10 px-4 py-3 text-sm font-semibold">Copilot <span className="font-normal text-card/60">· PayPal Agent Toolkit</span></p>
      <div ref={box} className="max-h-80 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {["What sold this week?", "Which orders still need shipping?", "How much came from AI agents?"].map((q) => (
              <button key={q} onClick={() => ask(q)} disabled={!aiReady} className="rounded-full border border-white/15 px-3 py-1.5 text-left text-xs hover:bg-white/10">{q}</button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
            {m.parts.map((p, i) => {
              if (p.type === "text") return <p key={i} className={`inline-block whitespace-pre-wrap rounded-xl px-3 py-2 ${m.role === "user" ? "bg-white/10" : ""}`}>{p.text}</p>;
              if (p.type.startsWith("tool-")) return <p key={i} className="mono text-[11px] text-card/50">↳ {p.type.slice(5)}</p>;
              return null;
            })}
          </div>
        ))}
        {busy && <p className="text-xs text-card/50">Thinking…</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-white/10 p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={!aiReady} placeholder={aiReady ? "Ask or tell it what to do…" : "Needs an AI key on the server"} className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2 text-sm outline-none placeholder:text-card/40" />
        <button disabled={busy || !input.trim()} className="btn btn-tomato !px-4 !py-2 text-sm">Send</button>
      </form>
    </div>
  );
}
