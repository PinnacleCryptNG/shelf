"use client";
import { useEffect, useState } from "react";
import { ProductArt } from "./product-art";

export type SceneItem = { id: string; name: string; shop: string; city: string; price: string; under: string; accent: string; image: string | null; stock: number | null };
const LOOP = 11000;

export function AgentScene({ items, shopCount, productCount }: { items: SceneItem[]; shopCount: number; productCount: number }) {
  const [t, setT] = useState(0);
  const [loop, setLoop] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(9000); return; }
    const start = performance.now();
    const id = setInterval(() => {
      const e = performance.now() - start;
      setT(e % LOOP);
      setLoop(Math.floor(e / LOOP));
    }, 60);
    return () => clearInterval(id);
  }, []);
  const pick = items.length ? items[loop % items.length] : null;
  const others = items.filter((p) => p.id !== pick?.id && p.shop !== pick?.shop).concat(items.filter((p) => p.id !== pick?.id && p.shop === pick?.shop)).slice(0, 3);
  const row = pick ? [...others.slice(0, loop % 4), pick, ...others.slice(loop % 4)].slice(0, 4) : [];
  const ASK = pick ? `Find me ${/^[aeiou]/i.test(pick.name) ? "an" : "a"} ${pick.name.toLowerCase()} under ${pick.under}` : "";
  const typed = ASK.slice(0, Math.min(ASK.length, Math.floor(t / 38)));
  const scanning = t > 1900;
  const matched = t > 3500;
  const receipt = t > 4600;
  const pressed = t > 6600 && t < 7300;
  const paid = t > 7400;

  return (
    <div className="panel-dark relative overflow-hidden p-4 shadow-[0_40px_80px_-40px_rgba(15,16,18,.55)] sm:p-5" aria-label="An AI agent finds a product on Shelf and the buyer approves the payment in PayPal">
      <div className="flex items-center justify-between text-[12px] text-white/45">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#ff4a24]" />Your AI assistant</span>
        <span className="mono">shelf/mcp</span>
      </div>

      <p className="mt-4 ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md bg-white/10 px-3.5 py-2.5 text-[14px]">
        <span className={t < 1900 ? "caret" : ""}>{typed || "\u00a0"}</span>
      </p>

      <div className={`mt-4 transition-opacity duration-500 ${scanning ? "opacity-100" : "opacity-0"}`}>
        <p className="mono text-[10.5px] text-white/45">search_all_products · {shopCount} shops · {productCount} products</p>
        <div className="relative mt-2 grid grid-cols-4 gap-2 overflow-hidden">
          {scanning && !matched && <span key={loop} className="scan-line" />}
          {row.map((p) => {
            const hit = matched && p.id === pick?.id;
            return (
              <div key={p.id} className={`rounded-xl p-1.5 transition duration-500 ${hit ? "bg-white text-ink ring-2 ring-[#ff4a24]" : matched ? "bg-white/5 opacity-40" : "bg-white/5"}`}>
                <div className="aspect-square overflow-hidden rounded-lg"><ProductArt name={p.name} accent={p.accent} image={p.image} /></div>
                <p className="mt-1.5 truncate text-[11px] font-semibold leading-tight">{p.name}</p>
                <p className={`mono truncate text-[10px] ${hit ? "text-ink/60" : "text-white/45"}`}>{p.price}{p.stock != null && <span className="hidden sm:inline"> · {p.stock} left</span>}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative mt-4 h-[178px]">
        {receipt && pick && (
          <div key={loop} className="print absolute inset-x-0 top-0 rounded-xl bg-[#fbfbf8] p-3.5 text-ink [mask-image:linear-gradient(#000_92%,transparent)]">
            <div className="flex justify-between text-[11px]"><span className="label !text-[10px] truncate">{pick.shop} · {pick.city}</span><span className="mono text-[10px] text-muted">create_checkout</span></div>
            <div className="mt-2 flex justify-between border-b border-dashed border-line pb-2 text-[13px]"><span className="truncate pr-3">1 × {pick.name}</span><span className="mono">{pick.price}</span></div>
            <div className="mt-2 flex justify-between text-[13px] font-semibold"><span>Total</span><span className="mono">{pick.price}</span></div>
            <div className={`btn btn-paypal mt-3 w-full !py-2 text-[13px] transition ${pressed ? "scale-[.97] brightness-95" : ""}`}>Approve {pick.price} in PayPal</div>
            {paid && <span className="stamp absolute right-[34%] top-8 rounded-md bg-[#fbfbf8]/80 border-2 border-moss px-2 py-0.5 text-[15px] font-bold tracking-widest text-moss">PAID</span>}
          </div>
        )}
      </div>
    </div>
  );
}
