"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CatalogGrid, type Market } from "@/components/catalog-grid";

type DraftProduct = { name: string; description: string; price: number; category: string; tags: string[]; image_url: string | null; stock?: number | null };
type Draft = { shop: { name: string; tagline: string; about: string; city: string; country: string; currency: string; ships_to: string }; products: DraftProduct[] };

const SAMPLE = `Marigold Kitchen — Mexican-Filipino home cooking, Toronto (Queen St W). Pickup or delivery within 5 km. Prices in CAD.
Adobo tacos (3) – $14
Lumpia, 6 pieces – $9
Ube tres leches slice – $7.50
Family tray: 12 tacos + rice + slaw – $52
House salsa macha jar 250ml – $12`;

export function Wizard({ aiReady }: { aiReady: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"url" | "text" | "photo">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [market, setMarket] = useState<{ state: "loading" | "ready" | "off"; byName: Record<string, Market>; note?: string }>({ state: "off", byName: {} });

  async function checkMarket(d: Draft) {
    setMarket({ state: "loading", byName: {} });
    try {
      const r = await fetch("/api/market", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currency: d.shop.currency, country: d.shop.country, products: d.products.map((p) => ({ name: p.name, category: p.category })) }) });
      const j = await r.json();
      if (!j.available) return setMarket({ state: "off", byName: {}, note: j.reason });
      const byName: Record<string, Market> = {};
      d.products.forEach((p, i) => (byName[p.name] = j.results[i]));
      setMarket({ state: "ready", byName });
    } catch {
      setMarket({ state: "off", byName: {} });
    }
  }
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onPhoto(f?: File) {
    if (!f) return;
    const bmp = await createImageBitmap(f);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    setImage(c.toDataURL("image/jpeg", 0.85));
  }

  async function read() {
    setErr(null); setBusy("Reading your shop…");
    const body = mode === "url" ? { url } : mode === "text" ? { text } : { image };
    const r = await fetch("/api/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok) return setErr(j.error || "Couldn't read that. Try pasting your price list instead.");
    setDraft(j.draft);
    void checkMarket(j.draft);
  }

  async function publish() {
    if (!draft) return;
    setErr(null); setBusy("Creating your shop…");
    const r = await fetch("/api/shops", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ draft, source_url: mode === "url" ? url : undefined, payee_email: email }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setBusy(null); return setErr(j.error || "Couldn't create the shop."); }
    setBusy("Adding products to PayPal…");
    await fetch(`/api/shops/${j.slug}/publish`, { method: "POST" });
    router.push(`/s/${j.slug}/dashboard?new=1`);
  }

  const setShop = (k: keyof Draft["shop"], v: string) => setDraft((d) => d && { ...d, shop: { ...d.shop, [k]: v } });

  if (!draft) {
    return (
      <section className="rise pt-6">
        <h1 className="display text-5xl font-semibold leading-tight">Open your shop to AI agents.</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">Show Shelf what you sell. It drafts the catalogue for you to check.</p>
        <div className="mt-8 inline-flex rounded-full border border-line bg-card p-1 text-sm">
          {([["url", "Website or Instagram"], ["photo", "Menu or price-list photo"], ["text", "Paste a list"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} className={`rounded-full px-3.5 py-2 ${mode === k ? "bg-ink text-card" : ""}`}>{l}</button>
          ))}
        </div>
        <div className="mt-5 max-w-2xl">
          {mode === "url" && <input className="field" inputMode="url" placeholder="https://yourshop.com or instagram.com/yourshop" value={url} onChange={(e) => setUrl(e.target.value)} />}
          {mode === "text" && (
            <>
              <textarea className="field min-h-48" placeholder="Paste your menu or price list…" value={text} onChange={(e) => setText(e.target.value)} />
              <button className="mt-2 text-sm underline underline-offset-4" onClick={() => setText(SAMPLE)}>Use a sample menu</button>
            </>
          )}
          {mode === "photo" && (
            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-card p-6 text-center">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="Your upload" className="max-h-64 rounded-lg" />
              ) : (<><span className="font-semibold">Take or choose a photo</span><span className="text-sm text-muted">A menu board, price list or product shelf works.</span></>)}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            </label>
          )}
          <button onClick={read} disabled={!!busy || !aiReady || (mode === "url" ? !url : mode === "text" ? !text : !image)} className="btn btn-tomato mt-5">{busy || "Draft my catalogue"}</button>
          {!aiReady && <p className="mt-3 text-sm text-tomato">The AI importer needs an Anthropic or Gemini key on the server.</p>}
          {err && <p className="mt-3 text-sm text-tomato">{err}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="rise pt-6">
      <p className="mono text-xs uppercase tracking-widest text-muted">Check before publishing</p>
      <h1 className="display mt-2 text-4xl font-semibold">Here&apos;s what Shelf found.</h1>
      <div className="mt-8 grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">Shop name<input className="field mt-1" value={draft.shop.name} onChange={(e) => setShop("name", e.target.value)} /></label>
        <label className="text-sm sm:col-span-2">Tagline<input className="field mt-1" value={draft.shop.tagline} onChange={(e) => setShop("tagline", e.target.value)} /></label>
        <label className="text-sm sm:col-span-2">About<textarea className="field mt-1 min-h-20" value={draft.shop.about} onChange={(e) => setShop("about", e.target.value)} /></label>
        <label className="text-sm">City<input className="field mt-1" value={draft.shop.city} onChange={(e) => setShop("city", e.target.value)} /></label>
        <label className="text-sm">Country<input className="field mt-1" value={draft.shop.country} onChange={(e) => setShop("country", e.target.value)} /></label>
        <label className="text-sm">Currency<input className="field mono mt-1 uppercase" maxLength={3} value={draft.shop.currency} onChange={(e) => setShop("currency", e.target.value.toUpperCase())} /></label>
        <label className="text-sm">Pickup / delivery<input className="field mt-1" value={draft.shop.ships_to} onChange={(e) => setShop("ships_to", e.target.value)} /></label>
        <label className="text-sm sm:col-span-2">PayPal email to receive payments <span className="text-muted">(optional in the sandbox)</span><input className="field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.example" /></label>
      </div>
      <h2 className="display mt-10 text-2xl font-semibold">{draft.products.length} products</h2>
      <p className="mt-1 text-sm text-muted">Tap a cell to edit it. Prices are what agents will be charged; leave stock blank for unlimited.{market.state !== "off" && " The Market column compares each price with similar products online, via Channel3."}{market.note && <span className="block text-xs">{market.note}</span>}</p>
      <div className="mt-4"><CatalogGrid rows={draft.products} currency={draft.shop.currency} market={market.state === "off" ? null : market.byName} marketLoading={market.state === "loading"} onChange={(products) => setDraft((d) => d && { ...d, products })} /></div>
      <div className="sticky bottom-3 mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-paper/95 p-3 backdrop-blur">
        <button onClick={publish} disabled={!!busy || !draft.products.length} className="btn btn-tomato">{busy || "Publish to PayPal & open to agents"}</button>
        <button onClick={() => setDraft(null)} disabled={!!busy} className="btn btn-ghost">Start over</button>
        {err && <p className="text-sm text-tomato">{err}</p>}
      </div>
    </section>
  );
}
