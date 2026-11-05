"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { CopyField } from "@/components/copy-field";
import { ProductsGrid } from "@/components/products-grid";
import { formatMoney, type Order, type ShopEvent } from "@/lib/types";

type P = { id: string; name: string; price_cents: number; stock: number | null; synced: boolean };
type ShopLite = { slug: string; name: string; currency: string; accent: string; is_demo: boolean };

const badge: Record<string, string> = {
  CREATED: "bg-paper text-muted", APPROVED: "bg-[#fff3d6] text-[#8a5a00]", PAID: "bg-mint text-moss",
  SHIPPED: "bg-[#e3ebff] text-[#1d4ed8]", REFUNDED: "bg-[#ffe6e0] text-[#c2290a]", CANCELLED: "bg-paper text-muted line-through",
};
const dot: Record<string, string> = { search: "bg-[#a7a79c]", checkout: "bg-[#ffc439]", paid: "bg-moss", shipped: "bg-[#1d4ed8]", refunded: "bg-[#ff4a24]", published: "bg-ink" };

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`;
}

export function Dashboard({ shop, mcpUrl, initialOrders, initialEvents, products: initialProducts, aiReady, paypalLive, readOnly, ownerLink }: {
  shop: ShopLite; mcpUrl: string; initialOrders: Order[]; initialEvents: ShopEvent[]; products: P[]; aiReady: boolean; paypalLive: boolean; readOnly: boolean; ownerLink: string | null;
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
      <div className="rise flex flex-wrap items-end justify-between gap-4 pt-6">
        <div>
          <p className="label flex items-center gap-2"><span className="ping h-2 w-2 rounded-full bg-[#ff4a24]" />Live dashboard{!paypalLive && " · PayPal mock mode"}</p>
          <h1 className="display mt-2 text-[2.3rem] leading-tight sm:text-[2.8rem]">{shop.name}</h1>
        </div>
        <div className="w-full max-w-md"><CopyField label="Agents connect at" value={mcpUrl} /></div>
      </div>

      {readOnly && (
        <p className="mt-6 flex gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 text-sm text-muted">
          <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0"><path d="M10 3C5.5 3 2.4 6.4 1.5 10c.9 3.6 4 7 8.5 7s7.6-3.4 8.5-7C17.6 6.4 14.5 3 10 3Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" fill="currentColor" /></svg>
          <span><strong className="font-semibold text-ink">View-only demo.</strong> Watch orders arrive live and ask the copilot questions; refunds, tracking and buyer details are reserved for the owner.</span>
        </p>
      )}
      {ownerLink && (
        <div className="mt-6 max-w-2xl rounded-2xl border border-[#ffc439] bg-[#fff8e6] p-4"><p className="mb-2 text-sm"><strong>Your private owner link.</strong> <span className="text-muted">Keep it secret; it opens this dashboard on any device.</span></p><CopyField value={ownerLink} /></div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        {[["Paid revenue", stats.revenue], ["Paid orders", String(stats.paid)], ["Bought by agents", `${stats.agentShare}%`], ["Agent searches", String(stats.searches)]].map(([k, v], i) => (
          <div key={k} className="bg-card p-5">
            <p className="text-[13px] text-muted">{k}</p>
            <p key={v} className="display rise mt-2 text-[1.9rem] leading-none">{v}</p>
            {i === 2 && <div className="mt-3 h-1 overflow-hidden rounded-full bg-paper"><div className="h-full rounded-full bg-[#ff4a24] transition-all duration-700" style={{ width: `${stats.agentShare}%` }} /></div>}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="seg" role="tablist">
              {(["orders", "products"] as const).map((t) => <button key={t} role="tab" aria-pressed={tab === t} aria-selected={tab === t} onClick={() => setTab(t)} className="capitalize">{t} <span className="mono ml-1 text-[11px] text-muted">{t === "orders" ? orders.length : products.length}</span></button>)}
            </div>
          </div>
          {tab === "orders" ? (
            orders.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-card/50 p-10 text-center"><p className="display text-xl">No orders yet</p><p className="mt-2 text-sm text-muted">Point an agent at your MCP address, or try the <a href="/agent" className="font-semibold text-ink underline underline-offset-2">demo agent</a>.</p></div> : (
              <ul className="space-y-3">{orders.map((o) => <OrderRow key={o.id} o={o} slug={shop.slug} readOnly={readOnly} onChange={(u) => setOrders((os) => os.map((x) => (x.id === u.id ? u : x)))} />)}</ul>
            )
          ) : (
            <ProductsGrid currency={shop.currency} rows={products.map((p) => ({ ...p, sold: sold[p.id] || 0 }))} />
          )}
        </section>

        <aside className="space-y-6">
          <div className="panel overflow-hidden">
            <p className="flex items-center justify-between border-b border-line px-4 py-3 text-sm font-semibold">Live activity<span className="mono flex items-center gap-1.5 text-[11px] font-normal text-muted"><span className="h-1.5 w-1.5 rounded-full bg-moss" />every 2.5s</span></p>
            <ul className="max-h-80 overflow-y-auto">
              {events.length === 0 && <li className="p-4 text-sm text-muted">Quiet so far.</li>}
              {events.slice(0, 40).map((e) => (
                <li key={e.id} className={`flex gap-3 border-b border-line/60 px-4 py-3 text-sm last:border-0 ${e.id === fresh ? "rise bg-[#ff4a24]/5" : ""}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[e.kind] || "bg-muted"} ${e.id === fresh ? "ping" : ""}`} />
                  <span className="min-w-0"><span className="block">{e.summary}</span><span className="text-xs text-muted">{e.actor} · {ago(e.created_at)}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <Copilot slug={shop.slug} aiReady={aiReady} readOnly={readOnly} />
        </aside>
      </div>
    </main>
  );
}

function OrderRow({ o, slug, readOnly, onChange }: { o: Order; slug: string; readOnly: boolean; onChange: (o: Order) => void }) {
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
    <li className="panel rise p-4 transition hover:border-ink/25 sm:p-5">
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
          <span className={`mono rounded-md px-2 py-1 text-[10px] font-medium ${badge[o.status]}`}>{o.status}</span>
        </div>
      </div>
      {o.status === "PAID" && !readOnly && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <button onClick={() => setOpen(open ? null : "ship")} className="btn btn-ghost !px-3 !py-1.5 text-sm">Add tracking</button>
          <button disabled={busy} onClick={() => confirm(`Refund ${formatMoney(o.total_cents, o.currency)} through PayPal?`) && act({ action: "refund" })} className="btn btn-ghost !px-3 !py-1.5 text-sm">Refund</button>
        </div>
      )}
      {open === "ship" && (
        <div className="rise mt-3 flex flex-wrap gap-2 rounded-xl bg-paper p-3">
          <select className="field !w-auto" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {["ROYAL_MAIL", "DHL", "UPS", "FEDEX", "USPS", "JAPAN_POST", "CTT", "OTHER"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="field !w-48" placeholder="Tracking number" value={num} onChange={(e) => setNum(e.target.value)} />
          <button disabled={busy || num.length < 3} onClick={() => act({ action: "ship", carrier, number: num })} className="btn btn-ink !py-2 text-sm">Save to PayPal</button>
        </div>
      )}
      {err && <p role="alert" className="mt-3 rounded-lg bg-[#ff4a24]/10 px-3 py-2 text-sm text-[#c2290a]">{err}</p>}
    </li>
  );
}

function Copilot({ slug, aiReady, readOnly }: { slug: string; aiReady: boolean; readOnly: boolean }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: `/api/copilot/${slug}` }), [slug]);
  const { messages, sendMessage, status, addToolApprovalResponse } = useChat({ transport, sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses });
  const [input, setInput] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [messages]);
  const busy = status === "submitted" || status === "streaming";
  const ask = (t: string) => { if (t.trim() && !busy) { sendMessage({ text: t }); setInput(""); } };
  return (
    <div className="panel-dark overflow-hidden">
      <p className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm font-semibold"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ff4a24]" />Copilot</span><span className="mono text-[10.5px] font-normal text-white/45">PayPal Agent Toolkit</span></p>
      <div ref={box} className="max-h-80 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {(readOnly ? ["What sold this week?", "How much came from AI agents?", "What is running low?"] : ["What sold this week?", "Which orders still need shipping?", "How much came from AI agents?"]).map((q) => (
              <button key={q} onClick={() => ask(q)} disabled={!aiReady} className="rounded-lg border border-white/12 px-3 py-2 text-left text-xs text-white/80 transition hover:border-white/30 hover:text-white">{q}</button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
            {m.parts.map((p, i) => {
              if (p.type === "text") return <p key={i} className={`inline-block whitespace-pre-wrap rounded-xl px-3 py-2 ${m.role === "user" ? "bg-white/10" : ""}`}>{p.text}</p>;
              if (p.type.startsWith("tool-")) {
                const t = p as { type: string; state?: string; input?: Record<string, unknown>; approval?: { id: string } };
                const name = t.type.slice(5);
                if (t.state === "approval-requested" && t.approval) {
                  const what = name === "refund_order" ? `Refund ${String(t.input?.order_id ?? "")} in full through PayPal` : `Add ${String(t.input?.carrier ?? "")} tracking ${String(t.input?.tracking_number ?? "")} to ${String(t.input?.order_id ?? "")}`;
                  return (
                    <div key={i} className="rise rounded-xl border border-[#ffc439]/50 bg-[#ffc439]/10 p-3 text-left">
                      <p className="flex items-center gap-1.5 text-xs text-[#ffc439]"><span className="ping h-1.5 w-1.5 rounded-full bg-[#ffc439]" />Needs your approval</p>
                      <p className="mt-1">{what}</p>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => addToolApprovalResponse({ id: t.approval!.id, approved: true })} className="btn btn-tomato !px-3 !py-1.5 text-xs">Approve</button>
                        <button onClick={() => addToolApprovalResponse({ id: t.approval!.id, approved: false, reason: "Owner declined" })} className="btn border border-white/20 !px-3 !py-1.5 text-xs text-white hover:border-white/50">Decline</button>
                      </div>
                    </div>
                  );
                }
                return <p key={i} className="mono text-[11px] text-card/50">↳ {name}{t.state === "output-denied" ? " · declined" : ""}</p>;
              }
              return null;
            })}
          </div>
        ))}
        {busy && <p className="flex items-center gap-1.5 text-xs text-white/50"><span className="ping h-1.5 w-1.5 rounded-full bg-white/60" />Thinking…</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-white/10 p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={!aiReady} placeholder={aiReady ? "Ask or tell it what to do…" : "Needs an AI key on the server"} className="min-w-0 flex-1 rounded-xl bg-white/10 px-3.5 py-2 text-sm outline-none ring-white/20 placeholder:text-white/40 focus:ring-1" />
        <button disabled={busy || !input.trim()} className="btn btn-tomato !px-4 !py-2 text-sm">Send</button>
      </form>
    </div>
  );
}
