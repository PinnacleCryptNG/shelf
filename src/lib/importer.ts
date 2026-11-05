import "server-only";
import { generateObject } from "ai";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { z } from "zod";
import { model } from "./ai";
import { PAYPAL_CURRENCIES } from "./types";

export const DraftSchema = z.object({
  shop: z.object({
    name: z.string().describe("Shop name"),
    tagline: z.string().describe("One sentence, max 90 characters, in the owner's voice"),
    about: z.string().describe("2-3 sentences a buyer or AI agent needs: what they make, how orders work"),
    city: z.string(),
    country: z.string(),
    currency: z.enum(PAYPAL_CURRENCIES).describe("ISO currency of the prices; pick the closest PayPal currency"),
    ships_to: z.string().describe("Delivery / pickup terms, short. Guess sensibly if missing."),
  }),
  products: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().describe("1-2 factual sentences: size, ingredients/materials, what's included"),
        price: z.number().describe("Unit price in major units, e.g. 12.5"),
        category: z.string().describe("Short category such as Bread, Mugs, Tea"),
        tags: z.array(z.string()).describe("3-6 lowercase search words buyers would use, incl. occasions and dietary facts"),
        image_url: z.string().nullable().describe("Absolute product image URL if one appears in the source, else null"),
      }),
    )
    .max(40),
});

export type Draft = z.infer<typeof DraftSchema>;

const SYSTEM = `You turn messy small-business material (websites, menus, price lists, social captions, photos of chalkboards) into a clean catalogue that AI shopping agents can search and buy from.
Rules:
- Only include items that are actually for sale with a price you can read. Never invent products or prices.
- If several sizes have different prices, make one product per size.
- Keep the owner's names for products. Fix obvious typos only.
- Descriptions are factual and short. No marketing fluff, no emojis.
- Tags are what a buyer would type: occasions (birthday, gift), dietary facts (vegan, gluten-free) only if stated.`;

const blocked = new BlockList();
for (const [a, p] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["224.0.0.0", 3]] as const) blocked.addSubnet(a, p, "ipv4");
for (const [a, p] of [["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["64:ff9b::", 96]] as const) blocked.addSubnet(a, p, "ipv6");

export function isPrivateAddress(addr: string): boolean {
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return isPrivateAddress(mapped[1]);
  const family = isIP(addr);
  if (!family) return true;
  return blocked.check(addr, family === 4 ? "ipv4" : "ipv6");
}

export async function assertPublicHost(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http(s) links are supported.");
  if (url.username || url.password) throw new Error("Links with passwords are not supported.");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Only standard web ports are supported.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new Error("Couldn't find that website.");
  if (addrs.some((a) => isPrivateAddress(a.address))) throw new Error("That address is not public.");
}

async function readCapped(res: Response, max: number) {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
    if (size >= max) {
      await reader.cancel();
      break;
    }
  }
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, max));
}

async function fetchText(url: string, accept = "text/html") {
  let u = new URL(url);
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicHost(u);
    const res = await fetch(u, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; ShelfImporter/1.0; +https://shelf-pinnaclecryptngs-projects.vercel.app)", accept },
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
    });
    const next = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && next) {
      await res.body?.cancel();
      u = new URL(next, u);
      continue;
    }
    if (!res.ok) throw new Error(`The page answered ${res.status}.`);
    return readCapped(res, 2_000_000);
  }
  throw new Error("That link redirects too many times.");
}

function pageDigest(html: string, base: string) {
  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()).join("\n").slice(0, 12_000);
  const meta = [...html.matchAll(/<meta[^>]+(?:property|name)="(og:[^"]+|description)"[^>]+content="([^"]*)"/gi)].map((m) => `${m[1]}: ${m[2]}`).join("\n");
  const imgs = [...html.matchAll(/<img[^>]+>/gi)]
    .map((m) => {
      const src = m[0].match(/(?:data-src|src)="([^"]+)"/i)?.[1];
      const alt = m[0].match(/alt="([^"]*)"/i)?.[1] || "";
      if (!src || src.startsWith("data:")) return null;
      try { return `${new URL(src, base).href} alt="${alt}"`; } catch { return null; }
    })
    .filter(Boolean)
    .slice(0, 60)
    .join("\n");
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<\/(p|div|li|h\d|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim().slice(0, 18_000);
  return `URL: ${base}\n\nMETA:\n${meta}\n\nJSON-LD:\n${ld}\n\nIMAGES:\n${imgs}\n\nTEXT:\n${text}`;
}

async function shopifyDigest(url: string) {
  try {
    const origin = new URL(url).origin;
    const raw = await fetchText(`${origin}/products.json?limit=40`, "application/json");
    const data = JSON.parse(raw) as { products?: { title: string; body_html: string; product_type: string; tags: string[] | string; variants: { title: string; price: string }[]; images: { src: string }[] }[] };
    if (!data.products?.length) return null;
    return "SHOPIFY PRODUCTS JSON:\n" + JSON.stringify(
      data.products.map((p) => ({
        title: p.title,
        type: p.product_type,
        tags: p.tags,
        body: p.body_html?.replace(/<[^>]+>/g, " ").slice(0, 300),
        variants: p.variants.slice(0, 4).map((v) => ({ title: v.title, price: v.price })),
        image: p.images?.[0]?.src,
      })),
    ).slice(0, 20_000);
  } catch {
    return null;
  }
}

export async function draftFromSource(input: { url?: string; text?: string; image?: { data: string; mediaType: string } }): Promise<Draft> {
  const m = model("smart");
  if (!m) throw new Error("Add an AI key (ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY) to import a shop.");
  const parts: ({ type: "text"; text: string } | { type: "image"; image: string; mediaType: string })[] = [];
  if (input.url) {
    const html = await fetchText(input.url);
    parts.push({ type: "text", text: pageDigest(html, input.url) });
    const shopify = await shopifyDigest(input.url);
    if (shopify) parts.push({ type: "text", text: shopify });
  }
  if (input.text) parts.push({ type: "text", text: `PASTED BY THE OWNER:\n${input.text.slice(0, 20_000)}` });
  if (input.image) parts.push({ type: "image", image: input.image.data, mediaType: input.image.mediaType });
  if (!parts.length) throw new Error("Give a link, some text or a photo.");
  parts.push({ type: "text", text: "Build the shop profile and catalogue from the material above." });
  const { object } = await generateObject({
    model: m,
    schema: DraftSchema,
    system: SYSTEM,
    messages: [{ role: "user", content: parts }],
    maxRetries: 1,
  });
  return object;
}
