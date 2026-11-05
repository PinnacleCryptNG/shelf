"use client";
import { useMemo, useState } from "react";
import { ProductArt } from "@/components/product-art";
import { formatMoney } from "@/lib/types";

type P = { id: string; name: string; description: string; price_cents: number; currency: string; category: string; image_url: string | null; stock: number | null };

export function Basket({ slug, accent, products, categories }: { slug: string; accent: string; products: P[]; categories: string[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cat, setCat] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lines = useMemo(() => products.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id] })), [cart, products]);
  const total = lines.reduce((a, l) => a + l.qty * l.price_cents, 0);
  const currency = products[0]?.currency || "USD";
  const shown = cat ? products.filter((p) => p.category === cat) : products;
  const add = (id: string, d: number) => setCart((c) => { const n = Math.max(0, (c[id] || 0) + d); const next = { ...c, [id]: n }; if (!n) delete next[id]; return next; });

  async function pay() {
    setBusy(true); setErr(null);
    const r = await fetch(`/api/shops/${slug}/checkout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: lines.map((l) => ({ product_id: l.id, quantity: l.qty })) }) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error || "Checkout failed."); setBusy(false); return; }
    window.location.href = j.approve_url;
  }

  const count = lines.reduce((a, l) => a + l.qty, 0);
  return (
    <div className="grid gap-10 pt-10 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-[1.7rem]">On the shelf <span className="ml-1 align-middle text-sm font-medium text-muted">{shown.length}</span></h2>
          {categories.length > 1 && (
            <div className="seg max-w-full overflow-x-auto [scrollbar-width:none]" role="group" aria-label="Filter by category">
              {[null, ...categories].map((c) => (
                <button key={c ?? "all"} aria-pressed={cat === c} onClick={() => setCat(c)} className="shrink-0 whitespace-nowrap">{c ?? "Everything"}</button>
              ))}
            </div>
          )}
        </div>
        {shown.length === 0 && <p className="panel p-8 text-center text-muted">Nothing on this shelf yet.</p>}
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 xl:grid-cols-3">
          {shown.map((p, i) => {
            const out = p.stock === 0;
            const low = !out && p.stock !== null && p.stock <= 3;
            const n = cart[p.id] || 0;
            return (
              <li key={p.id} id={p.id} className="rise group flex flex-col" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <div className={`relative aspect-[4/3] overflow-hidden rounded-[10px] bg-card transition ${n ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""}`}>
                  <ProductArt name={p.name} accent={accent} image={p.image_url} className={`transition duration-500 group-hover:scale-[1.04] ${out ? "grayscale" : ""}`} />
                  {(out || low) && <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[11px] font-semibold ${out ? "bg-ink text-white" : "bg-white text-[#c2410c]"}`}>{out ? "Sold out" : `Only ${p.stock} left`}</span>}
                </div>
                <div className="price-tag mt-2.5 flex flex-1 flex-col !p-3 sm:!px-4 sm:!py-3.5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <h3 className="text-[14px] font-semibold leading-snug sm:text-base">{p.name}</h3>
                    <span className="mono shrink-0 text-[12px] sm:text-[13px]">{formatMoney(p.price_cents, p.currency)}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 hidden text-sm leading-relaxed text-muted sm:block">{p.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-4">
                    <span className="label hidden sm:inline">{p.category}</span>
                    {n ? (
                      <span className="flex items-center gap-1 rounded-xl bg-paper p-1 text-sm">
                        <button aria-label={`Remove one ${p.name}`} onClick={() => add(p.id, -1)} className="h-8 w-8 rounded-lg bg-card transition hover:bg-white">−</button>
                        <span className="mono w-6 text-center" aria-live="polite">{n}</span>
                        <button aria-label={`Add one ${p.name}`} onClick={() => add(p.id, 1)} className="h-8 w-8 rounded-lg bg-card transition hover:bg-white">+</button>
                      </span>
                    ) : (
                      <button disabled={out} onClick={() => add(p.id, 1)} className="btn btn-ink w-full !px-3.5 !py-2 text-sm sm:w-auto">{out ? "Sold out" : "Add"}</button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="perf-top bg-[#fbfaf6] p-5 pt-7 shadow-[0_1px_0_var(--line),0_24px_48px_-32px_rgba(15,16,18,.45)]">
          <div className="flex items-baseline justify-between"><h2 className="display text-xl">Basket</h2>{count > 0 && <span className="mono text-xs text-muted">{count} item{count > 1 ? "s" : ""}</span>}</div>
          {lines.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">Your basket is empty.<br />Add something from the shelf.</div>
          ) : (
            <ul className="mt-4 space-y-2.5 text-sm">
              {lines.map((l) => <li key={l.id} className="rise flex justify-between gap-3"><span><span className="mono text-muted">{l.qty}×</span> {l.name}</span><span className="mono">{formatMoney(l.qty * l.price_cents, l.currency)}</span></li>)}
            </ul>
          )}
          <div className="mt-4 flex justify-between border-t border-dashed border-line pt-3 font-semibold"><span>Total</span><span className="mono">{formatMoney(total, currency)}</span></div>
          <button onClick={pay} disabled={!lines.length || busy} className="btn btn-paypal mt-4 w-full">{busy ? "Opening PayPal…" : "Pay with PayPal"}</button>
          {err && <p role="alert" className="mt-3 rounded-lg bg-[#ff4a24]/10 px-3 py-2 text-sm text-[#c2290a]">{err}</p>}
          <p className="mt-3 text-center text-xs text-muted">You&apos;ll review and approve the payment in PayPal.</p>
        </div>
        {lines.length > 0 && (
          <div className="fixed inset-x-3 bottom-3 z-20 lg:hidden">
            <button onClick={pay} disabled={busy} className="btn btn-paypal w-full shadow-[0_12px_30px_-10px_rgba(0,0,0,.4)]">{busy ? "Opening PayPal…" : `Pay ${formatMoney(total, currency)} with PayPal`}</button>
          </div>
        )}
      </aside>
    </div>
  );
}
