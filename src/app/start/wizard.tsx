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
    const r = await fetch("/api/shops", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ draft, source_url: mode === "url" ? url : undefined, }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setBusy(null); return setErr(j.error || "Couldn't create the shop."); }
    setBusy("Adding products to PayPal…");
    await fetch(`/api/shops/${j.slug}/publish`, { method: "POST" });
    router.push(`/s/${j.slug}/dashboard?new=1`);
  }

  const setShop = (k: keyof Draft["shop"], v: string) => setDraft((d) => d && { ...d, shop: { ...d.shop, [k]: v } });

  const stage = draft ? 1 : 0;
  const steps = (
    <ol className="flex items-center gap-2 text-[13px]" aria-label="Progress">
      {["Import", "Review", "Live"].map((l, i) => (
        <li key={l} className="flex items-center gap-2">
          <span className={`mono grid h-6 w-6 place-items-center rounded-full text-[11px] ${i < stage ? "bg-ink text-white" : i === stage ? "bg-[#ff4a24] text-white" : "border border-line text-muted"}`}>{i < stage ? "✓" : i + 1}</span>
          <span className={i === stage ? "font-semibold" : "text-muted"}>{l}</span>
          {i < 2 && <span className="mx-1 h-px w-6 bg-line sm:w-10" />}
        </li>
      ))}
    </ol>
  );

  if (!draft) {
    const ready = mode === "url" ? !!url : mode === "text" ? !!text : !!image;
    return (
      <section className="rise pt-8">
        {steps}
        <span className="aisle mt-8"><b>01</b><span>Import</span></span>
        <h1 className="display mt-5 text-[2.4rem] leading-[1.02] sm:text-[3.2rem]">Open your shop to AI agents.</h1>
        <p className="mt-3 max-w-xl text-[17px] text-muted">Show Shelf what you sell. It drafts the catalogue; you check it before anything goes live.</p>
        <div className="panel relative mt-8 overflow-hidden p-5 sm:p-6">
          <div className="seg flex-wrap" role="group" aria-label="Import from">
            {([["url", "Website or Instagram"], ["photo", "Menu photo"], ["text", "Paste a list"]] as const).map(([k, l]) => (
              <button key={k} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
          <div className="mt-5">
            {mode === "url" && <input className="field !py-3.5 !text-[16px]" inputMode="url" aria-label="Shop website or Instagram URL" placeholder="https://yourshop.com or instagram.com/yourshop" value={url} onChange={(e) => setUrl(e.target.value)} />}
            {mode === "text" && (
              <>
                <textarea className="field mono min-h-52 !text-[13px] leading-relaxed" aria-label="Menu or price list" placeholder="Paste your menu or price list…" value={text} onChange={(e) => setText(e.target.value)} />
                <button className="mt-2 text-sm font-medium text-muted underline underline-offset-4 hover:text-ink" onClick={() => setText(SAMPLE)}>Use a sample menu</button>
              </>
            )}
            {mode === "photo" && (
              <label className="dots flex min-h-52 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line p-6 text-center transition hover:border-ink/40">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="Your upload" className="max-h-64 rounded-lg shadow-sm" />
                ) : (<><span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-white" aria-hidden><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.3-2h5.2l1.3 2h1.6A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Z" /><circle cx="12" cy="13" r="3.5" /></svg></span><span className="mt-2 font-semibold">Take or choose a photo</span><span className="text-sm text-muted">A menu board, price list or product shelf works.</span></>)}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
              </label>
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button onClick={read} disabled={!!busy || !aiReady || !ready} className="btn btn-tomato">{busy || "Draft my catalogue"}</button>
            <p className="text-sm text-muted">Shelf only lists products and prices it can see. It never invents them.</p>
          </div>
          {busy && <span className="scan-line [animation-duration:1.6s] [animation-iteration-count:infinite]" aria-hidden />}
          {!aiReady && <p role="alert" className="mt-4 rounded-lg bg-[#ff4a24]/10 px-3 py-2 text-sm text-[#c2290a]">The AI importer needs an Anthropic or Gemini key on the server.</p>}
          {err && <p role="alert" className="mt-4 rounded-lg bg-[#ff4a24]/10 px-3 py-2 text-sm text-[#c2290a]">{err}</p>}
        </div>
        <ul className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
          {[["Your prices, untouched", "Agents are charged exactly what you publish."], ["Synced to PayPal", "Products go into your PayPal catalogue."], ["Your own agent address", "Claude, ChatGPT and any MCP agent can find you."]].map(([t, d]) => (
            <li key={t} className="border-l-2 border-[#ff4a24] pl-3"><p className="font-semibold">{t}</p><p className="mt-0.5 text-muted">{d}</p></li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="rise pt-8">
      {steps}
      <span className="aisle mt-8"><b>02</b><span>Review</span></span>
      <h1 className="display mt-5 text-[2.3rem] leading-[1.02] sm:text-[2.9rem]">Here&apos;s what Shelf found.</h1>
      <p className="mt-3 max-w-xl text-muted">Check the details and fix anything before it goes live.</p>
      <div className="panel mt-8 grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <p className="label sm:col-span-2">Shop details</p>
        <label className="text-sm font-medium sm:col-span-2">Shop name<input className="field mt-1.5" value={draft.shop.name} onChange={(e) => setShop("name", e.target.value)} /></label>
        <label className="text-sm font-medium sm:col-span-2">Tagline<input className="field mt-1.5" value={draft.shop.tagline} onChange={(e) => setShop("tagline", e.target.value)} /></label>
        <label className="text-sm font-medium sm:col-span-2">About<textarea className="field mt-1.5 min-h-20" value={draft.shop.about} onChange={(e) => setShop("about", e.target.value)} /></label>
        <label className="text-sm font-medium">City<input className="field mt-1.5" value={draft.shop.city} onChange={(e) => setShop("city", e.target.value)} /></label>
        <label className="text-sm font-medium">Country<input className="field mt-1.5" value={draft.shop.country} onChange={(e) => setShop("country", e.target.value)} /></label>
        <label className="text-sm font-medium">Currency<input className="field mono mt-1.5 uppercase" maxLength={3} value={draft.shop.currency} onChange={(e) => setShop("currency", e.target.value.toUpperCase())} /></label>
        <label className="text-sm font-medium">Pickup / delivery<input className="field mt-1.5" value={draft.shop.ships_to} onChange={(e) => setShop("ships_to", e.target.value)} /></label>
      </div>
      <div className="mt-12 flex flex-wrap items-end justify-between gap-3">
        <h2 className="display text-2xl">{draft.products.length} products</h2>
        {market.state === "loading" && <p className="mono flex items-center gap-2 text-[11px] text-muted"><span className="ping h-1.5 w-1.5 rounded-full bg-[#ff4a24]" />Checking market prices with Channel3…</p>}
        {market.state === "ready" && <p className="mono flex items-center gap-2 text-[11px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-moss" />Market prices from Channel3</p>}
      </div>
      <p className="mt-2 text-sm text-muted">Tap a cell to edit it. Prices are what agents will be charged; leave stock blank for unlimited.{market.state !== "off" && " The Market column compares each price with similar products online."}{market.note && <span className="block text-xs">{market.note}</span>}</p>
      <div className="mt-4"><CatalogGrid rows={draft.products} currency={draft.shop.currency} market={market.state === "off" ? null : market.byName} marketLoading={market.state === "loading"} onChange={(products) => setDraft((d) => d && { ...d, products })} /></div>
      <div className="sticky bottom-3 z-10 mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card/95 p-3 shadow-[0_18px_40px_-24px_rgba(15,16,18,.45)] backdrop-blur">
        <button onClick={publish} disabled={!!busy || !draft.products.length} className="btn btn-tomato">{busy || "Publish to PayPal & open to agents"}</button>
        <button onClick={() => setDraft(null)} disabled={!!busy} className="btn btn-ghost">Start over</button>
        {err && <p role="alert" className="text-sm text-[#c2290a]">{err}</p>}
      </div>
    </section>
  );
}
