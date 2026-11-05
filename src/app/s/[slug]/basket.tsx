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

  return (
    <div className="grid gap-10 [&>*]:min-w-0 pt-8 lg:grid-cols-[1fr_320px]">
      <section>
        {categories.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {[null, ...categories].map((c) => (
              <button key={c ?? "all"} onClick={() => setCat(c)} className={`rounded-full border px-3.5 py-1.5 text-sm ${cat === c ? "border-ink bg-ink text-card" : "border-line bg-card hover:border-ink"}`}>{c ?? "Everything"}</button>
            ))}
          </div>
        )}
        <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p, i) => {
            const out = p.stock === 0;
            return (
              <li key={p.id} id={p.id} className="rise" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="aspect-[4/3] overflow-hidden rounded-t-xl border border-b-0 border-line"><ProductArt name={p.name} accent={accent} image={p.image_url} /></div>
                <div className="shelf-edge !h-2 !rounded-none" />
                <div className="tag mt-3 p-4 pl-7">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold leading-snug">{p.name}</h3>
                    <span className="mono shrink-0 text-sm">{formatMoney(p.price_cents, p.currency)}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-sm text-muted">{p.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="mono text-[11px] uppercase tracking-wider text-muted">{out ? "Sold out" : p.stock !== null && p.stock <= 3 ? `${p.stock} left` : p.category}</span>
                    {cart[p.id] ? (
                      <span className="flex items-center gap-2 text-sm">
                        <button aria-label="Remove one" onClick={() => add(p.id, -1)} className="h-8 w-8 rounded-full border border-line bg-paper">−</button>
                        <span className="mono w-5 text-center">{cart[p.id]}</span>
                        <button aria-label="Add one" onClick={() => add(p.id, 1)} className="h-8 w-8 rounded-full border border-line bg-paper">+</button>
                      </span>
                    ) : (
                      <button disabled={out} onClick={() => add(p.id, 1)} className="btn btn-ghost !px-3.5 !py-1.5 text-sm">Add</button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-line bg-card p-5">
          <h2 className="display text-xl font-semibold">Basket</h2>
          {lines.length === 0 ? <p className="mt-2 text-sm text-muted">Nothing yet. Add something from the shelf.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {lines.map((l) => <li key={l.id} className="flex justify-between gap-3"><span>{l.qty} × {l.name}</span><span className="mono">{formatMoney(l.qty * l.price_cents, l.currency)}</span></li>)}
            </ul>
          )}
          <div className="mt-4 flex justify-between border-t border-line pt-3 font-semibold"><span>Total</span><span className="mono">{formatMoney(total, currency)}</span></div>
          <button onClick={pay} disabled={!lines.length || busy} className="btn btn-paypal mt-4 w-full">{busy ? "Opening PayPal…" : "Pay with PayPal"}</button>
          {err && <p className="mt-2 text-sm text-tomato">{err}</p>}
        </div>
        {lines.length > 0 && (
          <div className="fixed inset-x-3 bottom-3 z-20 lg:hidden">
            <button onClick={pay} disabled={busy} className="btn btn-paypal w-full shadow-lg">{busy ? "Opening PayPal…" : `Pay ${formatMoney(total, currency)} with PayPal`}</button>
          </div>
        )}
      </aside>
    </div>
  );
}
