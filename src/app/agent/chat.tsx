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
    <div className="my-2">
      <p className="mono flex items-center gap-2 text-[11px] text-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${part.state === "output-available" ? "bg-moss" : part.state === "output-error" ? "bg-tomato" : "ping bg-tomato"}`} />
        {LABEL[name] || name}<span className="opacity-60">· {name}</span>
      </p>
      {products && products.length > 0 && (
        <ul className="mt-2 grid gap-2 sm:grid-cols-3">
          {products.map((p) => (
            <li key={p.product_id} className="rise flex gap-2.5 rounded-xl border border-line bg-card p-2 sm:block">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg sm:mb-2 sm:h-20 sm:w-full"><ProductArt name={p.name} accent="#d9502b" image={p.image_url} /></div>
              <div className="min-w-0 text-sm"><p className="truncate font-semibold">{p.name}</p><p className="mono text-xs">{p.price}</p><p className="truncate text-xs text-muted">{p.shop_name || p.shop}</p></div>
            </li>
          ))}
        </ul>
      )}
      {checkout && (
        <div className="rise mt-2 rounded-2xl border-2 border-[#ffc439] bg-card p-4">
          <p className="text-sm text-muted">The agent built this order. Nothing is charged until you approve it.</p>
          <p className="mt-1 font-semibold">{checkout.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a href={checkout.approve_url} target="_blank" rel="noreferrer" onClick={() => setTimeout(() => onApproved(checkout.order_id), 400)} className="btn btn-paypal">Approve {checkout.total} in PayPal</a>
            <button onClick={() => onApproved(checkout.order_id)} className="btn btn-ghost !py-2 text-sm">I&apos;ve approved it</button>
          </div>
        </div>
      )}
      {status && (
        <p className={`mono mt-2 inline-block rounded-full px-2.5 py-1 text-xs ${status === "PAID" || status === "SHIPPED" ? "bg-emerald-100 text-emerald-900" : "bg-paper text-muted"}`}>{status}</p>
      )}
    </div>
  );
}

export function AgentChat({ aiReady, model }: { aiReady: boolean; model: string }) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/agent" }), []);
  const { messages, sendMessage, status, error } = useChat<UIMessage>({ transport });
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);
  const busy = status === "submitted" || status === "streaming";
  const ask = (t: string) => { if (t.trim() && !busy) { sendMessage({ text: t }); setInput(""); } };

  useEffect(() => {
    if (!pending) return;
    const onFocus = () => { ask(`I've approved order ${pending} in PayPal. Is it paid?`); setPending(null); };
    window.addEventListener("focus", onFocus, { once: true });
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <div className="flex min-h-[calc(100dvh-96px)] flex-col">
      <div className="rise pt-4">
        <h1 className="display text-4xl font-semibold leading-tight sm:text-5xl">An AI agent, shopping small.</h1>
        <p className="mt-2 text-muted">This agent only knows Shelf&apos;s public MCP address, the same one Claude or ChatGPT would use. {aiReady && <span className="mono text-xs">({model})</span>}</p>
      </div>
      <div className="flex-1 space-y-5 py-6">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            {PROMPTS.map((p) => <button key={p} disabled={!aiReady} onClick={() => ask(p)} className="rounded-xl border border-line bg-card px-4 py-3 text-left hover:border-ink">{p}</button>)}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={m.role === "user" ? "max-w-[85%] rounded-2xl bg-ink px-4 py-2.5 text-card" : "w-full"}>
              {m.parts.map((p, i) => {
                if (p.type === "text") return <p key={i} className="whitespace-pre-wrap leading-relaxed">{p.text}</p>;
                if (p.type === "dynamic-tool" || p.type.startsWith("tool-")) return <Tool key={i} part={p as unknown as ToolPart} onApproved={(id) => { setPending(null); ask(`I've approved order ${id} in PayPal. Is it paid?`); }} />;
                return null;
              })}
            </div>
          </div>
        ))}
        {status === "submitted" && <p className="text-sm text-muted">Thinking…</p>}
        {error && <p className="text-sm text-tomato">{error.message}</p>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="sticky bottom-3 flex gap-2 rounded-full border border-line bg-card p-1.5 shadow-sm">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={!aiReady} placeholder={aiReady ? "What are you looking for?" : "The demo agent needs an AI key on the server"} className="min-w-0 flex-1 bg-transparent px-4 text-[15px] outline-none" />
        <button disabled={busy || !input.trim()} className="btn btn-ink !py-2">Ask</button>
      </form>
    </div>
  );
}
