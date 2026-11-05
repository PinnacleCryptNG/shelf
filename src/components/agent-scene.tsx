"use client";
import { useEffect, useState } from "react";
import { ProductArt } from "./product-art";

export type SceneItem = { id: string; name: string; shop: string; city: string; price: string; under: string; accent: string; image: string | null; stock: number | null };
const LOOP = 11000;

export function AgentScene({ items, shopCount, productCount }: { items: SceneItem[]; shopCount: number; productCount: number }) {
  const [t, setT] = useState(0);
  const [loop, setLoop] = useState(0);
  const [cols, setCols] = useState(6);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const fit = () => setCols(mq.matches ? 6 : 3);
    fit();
    mq.addEventListener("change", fit);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(9000); return () => mq.removeEventListener("change", fit); }
    const start = performance.now();
    const id = setInterval(() => {
      const e = performance.now() - start;
      setT(e % LOOP);
      setLoop(Math.floor(e / LOOP));
    }, 50);
    return () => { clearInterval(id); mq.removeEventListener("change", fit); };
  }, []);

  const pages = Math.max(1, Math.ceil(items.length / cols));
  const page = Math.floor(loop / cols) % pages;
  const row = items.slice(page * cols, page * cols + cols);
  while (row.length < Math.min(cols, items.length)) row.push(items[row.length % items.length]);
  const pickIdx = row.length ? (loop * 4 + 1) % row.length : 0;
  const pick = row[pickIdx] ?? null;

  const ask = pick ? `Find me ${/^[aeiou]/i.test(pick.name) ? "an" : "a"} ${pick.name.replace(/,.*$/, "").replace(/\s*\(.*\)$/, "").toLowerCase()} under ${pick.under}` : "";
  const typed = ask.slice(0, Math.min(ask.length, Math.floor(t / 34)));
  const scanning = t > 1700 && t < 3300;
  const matched = t > 3300;
  const receipt = t > 4100;
  const pressed = t > 6300 && t < 6900;
  const paid = t > 7000;

  return (
    <div className="relative" aria-label="Live demo: an AI agent searches real Shelf products, picks one, and the buyer approves the payment in PayPal">
      <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-semibold text-white">AI</span>
          <p className="min-w-0 truncate text-[15px] sm:text-[17px]"><span className={t < 1700 ? "caret" : ""}>{typed || "\u00a0"}</span></p>
        </div>
        <p className="mono flex shrink-0 items-center gap-2 text-[11px] text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${scanning ? "bg-laser" : "bg-moss"}`} />
          search_all_products · {shopCount} shops · {productCount} products · live
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px] [&>*]:min-w-0">
        <div className="relative">
          <ul className="relative grid gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, row.length)}, minmax(0, 1fr))` }}>
            {row.map((p, i) => {
              const hit = matched && i === pickIdx;
              return (
                <li key={`${page}-${p.id}-${i}`} className="stock-in" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className={`relative aspect-[4/5] overflow-hidden rounded-[6px] bg-card transition duration-500 ${hit ? "-translate-y-2 shadow-[0_18px_30px_-16px_rgba(15,16,18,.55)] ring-2 ring-laser" : matched ? "opacity-35 saturate-50" : ""}`}>
                    <ProductArt name={p.name} accent={p.accent} image={p.image} eager />
                  </div>
                  <div className={`price-tag mt-3 transition duration-500 ${matched && !hit ? "opacity-40" : ""}`}>
                    <p className="line-clamp-2 min-h-[2.5em] text-[12px] font-medium leading-tight">{p.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-1">
                      <span className="mono text-[12px] font-medium">{p.price}</span>
                      {p.stock != null && <span className={`mono hidden whitespace-nowrap text-[10px] xl:inline ${p.stock <= 3 ? "text-[#c2410c]" : "text-moss"}`}>{p.stock} left</span>}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {scanning && <span key={loop} className="scan-beam" />}
        </div>

        <div className="relative min-h-[214px] rounded-[8px] border border-dashed border-line">
          {!receipt && (
            <p className="absolute inset-0 grid place-items-center px-6 text-center text-[13px] text-muted">
              {matched && pick ? <>Picked <span className="font-medium text-ink">{pick.name}</span> from {pick.shop}</> : "Waiting for the agent"}
            </p>
          )}
          {receipt && pick && (
            <div key={loop} className="print receipt absolute inset-0 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{pick.shop}</p>
                  <p className="mono text-[10px] text-muted">{pick.city} · create_checkout</p>
                </div>
                <span className={`stamp-slot ${paid ? "stamp" : "invisible"} rounded-[4px] border-2 border-moss px-1.5 py-0.5 text-[12px] font-bold tracking-[.18em] text-moss`}>PAID</span>
              </div>
              <div className="mt-4 flex justify-between gap-3 border-b border-dashed border-line pb-2.5 text-[13px]"><span className="truncate">1 × {pick.name}</span><span className="mono shrink-0">{pick.price}</span></div>
              <div className="mt-2.5 flex justify-between text-[13px] font-semibold"><span>Total</span><span className="mono">{pick.price}</span></div>
              <div className={`btn btn-paypal mt-4 w-full !py-2.5 text-[13px] transition ${pressed ? "scale-[.97] brightness-95" : ""}`}>{paid ? "Approved in PayPal" : `Approve ${pick.price} in PayPal`}</div>
              <p className="mt-2 text-center text-[11px] text-muted">{paid ? "Captured. The shop sees it live." : "The buyer approves. The agent can't pay."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
