const STRONG: [RegExp, string][] = [
  [/tres leches|\bube\b/i, "ube-tres-leches"],
  [/lumpia|spring rolls?/i, "lumpia"],
  [/\btacos?\b/i, "adobo-tacos"],
  [/salsa|chil+i oil|hot sauce/i, "salsa-macha"],
  [/(matcha|tea|starter) kit/i, "matcha-kit"],
  [/sourdough starter/i, "sourdough-starter"],
  [/sourdough|country loaf|boule/i, "country-sourdough"],
  [/\brye\b/i, "seeded-rye"],
  [/cardamom|cinnamon (bun|roll)/i, "cardamom-buns"],
  [/cookies?\b/i, "chocolate-cookies"],
  [/drizzle|lemon cake/i, "lemon-drizzle"],
  [/dripper|pour[- ]over/i, "pour-over-dripper"],
  [/\bmugs?\b/i, "tide-mug"],
  [/\bvases?\b/i, "bud-vase"],
  [/platter/i, "serving-platter"],
  [/chasen|matcha whisk/i, "chasen-whisk"],
  [/matcha/i, "uji-matcha"],
  [/sencha/i, "sencha"],
  [/hojicha/i, "hojicha"],
];
const GOODS = /ceramic|pottery|tableware|home|kitchenware|homeware|gift/i;
const WEAK: [RegExp, string, RegExp?][] = [
  [/\btray\b/i, "family-tray"],
  [/sponge|cake/i, "birthday-sponge"],
  [/\bbuns?\b/i, "cardamom-buns"],
  [/\bbowls?\b/i, "breakfast-bowls", GOODS],
  [/\bbread\b|\bloaf\b/i, "country-sourdough"],
];

const pick = (list: [RegExp, string, RegExp?][], s: string, category = "") => {
  const hit = list.find(([re, , only]) => re.test(s) && (!only || only.test(category)));
  return hit ? `/products/${hit[1]}.webp` : null;
};

export const localPhoto = (name: string, strongOnly = false, category = "") => pick(STRONG, name) ?? (strongOnly ? null : pick(WEAK, name, category));

export type Photo = { url: string; credit: string | null };

const LICENSE = /^(cc0|public domain|cc by(-sa)? [\d.]+)$/i;

const words = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z\s-]/g, " ").split(/[\s-]+/).filter((w) => w.length > 2);

export async function commonsPhoto(query: string, category = ""): Promise<Photo | null> {
  const q = `${query} ${category}`.replace(/\(.*?\)|\b\d+\s*(g|kg|ml|l|cm|pcs|pc|x)?\b|[:+,&/]/gi, " ").replace(/\s+/g, " ").trim();
  if (q.length < 3) return null;
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  for (const [k, v] of Object.entries({ action: "query", format: "json", generator: "search", gsrsearch: `${q} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "6", prop: "imageinfo", iiprop: "url|size|extmetadata", iiextmetadatafilter: "LicenseShortName|Artist", iiurlwidth: "800" })) url.searchParams.set(k, v);
  try {
    const res = await fetch(url, { headers: { "user-agent": "ShelfImporter/1.0 (https://github.com/PinnacleCryptNG/shelf)" }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { query?: { pages?: Record<string, { index: number; title: string; imageinfo?: { thumburl?: string; width: number; extmetadata?: Record<string, { value: string }> }[] }> } };
    const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index);
    const need = [...new Set(words(query))];
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      const license = info?.extmetadata?.LicenseShortName?.value ?? "";
      if (!info?.thumburl || info.width < 500 || !LICENSE.test(license)) continue;
      const title = p.title.toLowerCase().replace(/[_-]/g, " ");
      if (need.filter((w) => title.includes(w)).length < Math.min(2, need.length)) continue;
      const artist = (info.extmetadata?.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim().slice(0, 80);
      return { url: info.thumburl, credit: `${artist || "Unknown author"} · ${license} · Wikimedia Commons` };
    }
  } catch {}
  return null;
}

export async function findPhoto(name: string, category = ""): Promise<Photo | null> {
  const strong = localPhoto(name, true);
  if (strong) return { url: strong, credit: null };
  const found = await commonsPhoto(name, category);
  if (found) return found;
  const weak = localPhoto(name, false, category);
  return weak ? { url: weak, credit: null } : null;
}
