"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductArt } from "@/components/product-art";

type ToolPart = { type: string; toolName?: string; state: string; input?: unknown; output?: unknown; errorText?: string };
type Prod = { product_id: string; name: string; price: string; shop: string; shop_name?: string; location?: string; description?: string; image_url?: string | null };
type Checkout = { order_id: string; approve_url: string; total: string; lines: { name: string; quantity: number }[] };

const PROMPTS = [
  "Find me a birthday cake in Bristol under £40",
  "I want a handmade mug as a gift, under €40",
  "Order 100g of good matcha shipped from Japan",
];

const LABEL: Record<string, string> = {
  find_shops: "Looking through shops",
  search_all_products: "Searching every shop",
  search_products: "Searching the shop",
  get_shop_info: "Reading shop details",
  create_checkout: "Creating a PayPal order",
  get_order_status: "Checking the order with PayPal",
};

function parse(output: unknown): Record<string, unknown> | null {
  const c = (output as { content?: { type: string; text?: string }[] })?.content?.[0];
  if (c?.type === "text" && c.text) { try { return JSON.parse(c.text); } catch { return null; } }
  return null;
}

function Tool({ part, onApproved }: { part: ToolPart; onApproved: (id: string) => void }) {
  const name = part.toolName || part.type.replace(/^tool-/, "");
  const data = part.state === "output-available" ? parse(part.output) : null;
  const products = (data?.products as Prod[] | undefined)?.slice(0, 3);
  const checkout = name === "create_checkout" && data?.approve_url ? (data as unknown as Checkout) : null;
  const status = name === "get_order_status" ? (data?.status as string | undefined) : undefined;
  return (
    <div className="my-3">
      <p className="mono flex w-fit items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[11px] text-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${part.state === "output-available" ? "bg-moss" : part.state === "output-error" ? "bg-[#ff4a24]" : "ping bg-[#ff4a24]"}`} />
        {LABEL[name] || name}<span className="opacity-60">· {name}</span>
      </p>
      {products && products.length > 0 && (
        <ul className="mt-2.5 grid gap-2 sm:grid-cols-3">
          {products.map((p) => (
            <li key={p.product_id} className="rise panel relative flex gap-2.5 overflow-hidden p-2 sm:block">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg sm:mb-2 sm:h-24 sm:w-full"><ProductArt name={p.name} accent="#ff4a24" image={p.image_url} /><span className="scan-line" /></div>
              <div className="min-w-0 px-0.5 text-sm"><p className="truncate font-semibold">{p.name}</p><p className="mono text-[12px]">{p.price}</p><p className="truncate text-xs text-muted">{p.shop_name || p.shop}</p></div>
            </li>
          ))}
        </ul>
      )}
      {checkout && (
        <div className="print mt-2.5 max-w-md rounded-2xl border border-line bg-card p-5 shadow-[0_24px_48px_-32px_rgba(15,16,18,.4)]">
          <p className="label">Order ready · needs your approval</p>
          <ul className="mono mt-3 space-y-1.5 border-b border-dashed border-line pb-3 text-[13px]">{checkout.lines.map((l) => <li key={l.name}>{l.quantity} × {l.name}</li>)}</ul>
          <p className="mt-3 flex justify-between font-semibold"><span>Total</span><span className="mono">{checkout.total}</span></p>
          <p className="mt-1 text-xs text-muted">Nothing is charged until you approve it in PayPal.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a href={checkout.approve_url} target="_blank" rel="noreferrer" onClick={() => setTimeout(() => onApproved(checkout.order_id), 400)} className="btn btn-paypal">Approve {checkout.total} in PayPal</a>
            <button onClick={() => onApproved(checkout.order_id)} className="btn btn-ghost !py-2 text-sm">I&apos;ve approved it</button>
          </div>
        </div>
      )}
      {status && (
        <p className={`mono stamp mt-3 inline-block rounded-md border-2 px-2.5 py-1 text-xs font-bold tracking-[.18em] ${status === "PAID" || status === "SHIPPED" ? "border-moss text-moss" : "border-line text-muted"}`}>{status}</p>
      )}
    </div>
  );
}

export function AgentChat({ aiReady, model, resumeOrder = null }: { aiReady: boolean; model: string; resumeOrder?: string | null }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/agent" }), []);
  const { messages, sendMessage, status, error } = useChat<UIMessage>({ transport });
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);
  const busy = status === "submitted" || status === "streaming";
  const ask = (t: string) => { if (t.trim() && !busy) { sendMessage({ text: t }); setInput(""); } };

  const resumed = useRef(false);
  useEffect(() => {
    if (!resumeOrder || !aiReady || resumed.current) return;
    resumed.current = true;
    sendMessage({ text: `I've approved order ${resumeOrder} in PayPal. Is it paid?` });
    window.history.replaceState(null, "", "/agent");
  }, [resumeOrder, aiReady, sendMessage]);

  useEffect(() => {
    if (!pending) return;
    const onFocus = () => { ask(`I've approved order ${pending} in PayPal. Is it paid?`); setPending(null); };
    window.addEventListener("focus", onFocus, { once: true });
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <div className="flex min-h-[calc(100dvh-72px)] flex-col">
      <div className="rise pt-8">
        <span className="aisle"><b>AI</b><span>Shopping agent</span></span>
        <h1 className="display mt-5 text-[2.4rem] leading-[1.02] sm:text-[3.2rem]">Watch an AI agent<br className="hidden sm:block" /> shop small.</h1>
        <p className="mt-3 max-w-xl text-muted">It only knows Shelf&apos;s public MCP address, the same one Claude or ChatGPT would use. You approve any payment in PayPal.</p>
        {aiReady && <p className="mono mt-3 flex items-center gap-2 text-[11px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-moss" />{model} · connected to /mcp</p>}
      </div>
      <div className="flex-1 space-y-5 py-6">
        {messages.length === 0 && (
          <div className="grid gap-2 sm:grid-cols-3">
            {PROMPTS.map((p, i) => <button key={p} disabled={!aiReady} onClick={() => ask(p)} className="rise group panel flex min-h-28 flex-col justify-between p-4 text-left transition hover:-translate-y-0.5 hover:border-ink disabled:opacity-50" style={{ animationDelay: `${i * 70}ms` }}><span className="text-[15px] leading-snug">{p}</span><span className="mono mt-4 text-[11px] text-muted transition group-hover:text-[#ff4a24]">Ask →</span></button>)}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={m.role === "user" ? "rise max-w-[85%] rounded-[14px] rounded-br-[4px] bg-ink px-4 py-2.5 text-white" : "w-full"}>
              {m.parts.map((p, i) => {
                if (p.type === "text") return <p key={i} className="whitespace-pre-wrap leading-relaxed">{p.text.split(/\*\*(.+?)\*\*/g).map((t, k) => (k % 2 ? <strong key={k} className="font-semibold">{t}</strong> : t))}</p>;
                if (p.type === "dynamic-tool" || p.type.startsWith("tool-")) return <Tool key={i} part={p as unknown as ToolPart} onApproved={(id) => { setPending(null); ask(`I've approved order ${id} in PayPal. Is it paid?`); }} />;
                return null;
              })}
            </div>
          </div>
        ))}
        {status === "submitted" && <p className="flex items-center gap-2 text-sm text-muted"><span className="ping h-1.5 w-1.5 rounded-full bg-[#ff4a24]" />Thinking…</p>}
        {error && <p role="alert" className="rounded-lg bg-[#ff4a24]/10 px-3 py-2 text-sm text-[#c2290a]">{error.message}</p>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="sticky bottom-3 flex gap-2 rounded-[14px] border border-line bg-card/95 p-1.5 shadow-[0_18px_40px_-24px_rgba(15,16,18,.45)] backdrop-blur focus-within:border-ink">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={!aiReady} placeholder={aiReady ? "What are you looking for?" : "The demo agent needs an AI key on the server"} aria-label="Ask the shopping agent" className="min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none" />
        <button disabled={busy || !input.trim()} className="btn btn-tomato !py-2">Ask</button>
      </form>
    </div>
  );
}
