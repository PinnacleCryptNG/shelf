const API = "https://api.trychannel3.com/v1/search";
const CURRENCIES = ["USD", "CAD", "AUD", "GBP", "EUR", "SEK", "CZK", "RON", "CHF", "PLN"];
const COUNTRIES: Record<string, string> = {
  "united states": "US", usa: "US", canada: "CA", "united kingdom": "GB", uk: "GB", england: "GB", scotland: "GB", wales: "GB",
  ireland: "IE", australia: "AU", germany: "DE", austria: "AT", france: "FR", belgium: "BE", italy: "IT", spain: "ES",
  netherlands: "NL", sweden: "SE", finland: "FI", portugal: "PT", "czech republic": "CZ", czechia: "CZ", greece: "GR",
  romania: "RO", switzerland: "CH", poland: "PL",
};

export type MarketCheck = { low: number; median: number; high: number; count: number; examples: { title: string; domain: string; price: number; url: string }[] };

export const channel3Configured = () => Boolean(process.env.CHANNEL3_API_KEY);
export const channel3Supports = (currency: string) => CURRENCIES.includes(currency.toUpperCase());

type C3Product = { title: string; offers?: { url: string; domain: string; price: { price: number; currency: string }; availability: string }[] };

async function searchOne(query: string, currency: string, country?: string): Promise<MarketCheck | null> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "x-api-key": process.env.CHANNEL3_API_KEY!, "content-type": "application/json" },
    body: JSON.stringify({ query, limit: 10, currency, ...(country ? { country } : {}) }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Channel3 ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { products?: C3Product[] };
  const examples = (data.products || [])
    .map((p) => {
      const o = (p.offers || []).filter((x) => x.price?.currency === currency && x.availability !== "OutOfStock").sort((a, b) => a.price.price - b.price.price)[0];
      return o ? { title: p.title, domain: o.domain, price: o.price.price, url: o.url } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  if (examples.length < 2) return null;
  const prices = examples.map((e) => e.price).sort((a, b) => a - b);
  return { low: prices[0], median: prices[Math.floor(prices.length / 2)], high: prices[prices.length - 1], count: prices.length, examples: examples.slice(0, 3) };
}

export async function marketCheck(items: { name: string; category?: string }[], currency: string, country?: string | null) {
  const cur = currency.toUpperCase();
  const cc = country ? COUNTRIES[country.trim().toLowerCase()] : undefined;
  const results = await Promise.allSettled(items.slice(0, 25).map((i) => searchOne(i.name, cur, cc)));
  return results.map((r) => (r.status === "fulfilled" ? r.value : null));
}
