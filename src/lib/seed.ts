type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

type SeedProduct = [name: string, description: string, price: number, category: string, tags: string[], stock: number | null];

const SHOPS: {
  id: string; slug: string; name: string; tagline: string; about: string; city: string; country: string;
  currency: string; ships_to: string; accent: string; products: SeedProduct[];
}[] = [
  {
    id: "shop_fernhill", slug: "fernhill-bakehouse", name: "Fernhill Bakehouse",
    tagline: "Slow sourdough and cardamom buns, baked before sunrise.",
    about: "A two-oven bakery run by Ada and Tom. Bread is baked daily from 4am; orders placed before 8pm are ready the next morning.",
    city: "Bristol", country: "United Kingdom", currency: "GBP", ships_to: "Collection in Bristol, or local delivery within 8 km",
    accent: "#b45309",
    products: [
      ["Country sourdough", "48-hour fermented white and wholemeal loaf with a dark, blistered crust. About 900 g.", 6.5, "Bread", ["sourdough", "vegan", "loaf"], 24],
      ["Seeded rye", "Dense Danish-style rye with sunflower, flax and pumpkin seeds. Keeps for a week.", 7, "Bread", ["rye", "seeded", "vegan"], 12],
      ["Cardamom buns (box of 4)", "Knotted brioche buns rolled in cardamom sugar. Best eaten the same day.", 11, "Pastry", ["buns", "cardamom", "sweet", "box"], 18],
      ["Brown butter chocolate cookies (6)", "Chewy edges, gooey centre, flaky salt. Contains nuts.", 9, "Pastry", ["cookies", "chocolate", "gift"], 30],
      ["Birthday sponge, 8 inch", "Vanilla sponge with raspberry jam and whipped cream. Message piped on top. Needs 48 hours notice.", 38, "Cakes", ["cake", "birthday", "celebration", "custom"], 4],
      ["Lemon drizzle loaf", "Sharp lemon syrup soaked into a light loaf cake. Serves 8.", 16, "Cakes", ["cake", "lemon", "loaf"], 8],
      ["Sourdough starter + guide", "A jar of our 9-year-old starter with a printed feeding guide.", 8, "Pantry", ["starter", "gift", "baking"], 15],
    ],
  },
  {
    id: "shop_kiln", slug: "kiln-and-tide", name: "Kiln & Tide",
    tagline: "Stoneware thrown by hand in a seaside studio.",
    about: "Inês makes small batches of wheel-thrown stoneware glazed with sea-sand ash. Every piece is food and dishwasher safe and ships in recycled packaging.",
    city: "Lisbon", country: "Portugal", currency: "EUR", ships_to: "Ships across the EU and UK in 3–6 working days",
    accent: "#0f766e",
    products: [
      ["Tide mug", "350 ml mug in a speckled sea-foam glaze. Each one is slightly different.", 32, "Mugs", ["mug", "coffee", "tea", "gift"], 14],
      ["Pour-over dripper", "Single-cup coffee dripper with three spiral ribs. Fits standard #2 filters.", 45, "Coffee", ["coffee", "dripper", "pour-over"], 6],
      ["Breakfast bowl set (2)", "Two 15 cm bowls in matte sand glaze, sized for cereal or ramen.", 58, "Tableware", ["bowl", "set", "kitchen"], 9],
      ["Bud vase", "Small narrow-neck vase for single stems. 12 cm tall.", 24, "Home", ["vase", "flowers", "gift", "small"], 20],
      ["Serving platter", "Large oval platter, 38 cm, with an ash-blue rim.", 89, "Tableware", ["platter", "serving", "dinner"], 3],
    ],
  },
  {
    id: "shop_mori", slug: "mori-tea-works", name: "Mori Tea Works",
    tagline: "Single-garden Japanese teas, packed to order.",
    about: "Kenji sources directly from four family tea gardens in Shizuoka and Uji, and packs every order by hand on the day it ships.",
    city: "Kyoto", country: "Japan", currency: "JPY", ships_to: "Ships worldwide by Japan Post in 5–10 days",
    accent: "#4d7c0f",
    products: [
      ["Uji ceremonial matcha, 30 g", "Stone-ground first-flush matcha. Bright green, sweet, very low bitterness.", 3800, "Matcha", ["matcha", "ceremonial", "uji"], 25],
      ["Shizuoka sencha, 100 g", "Deep-steamed sencha with a grassy, savoury cup.", 1900, "Green tea", ["sencha", "green tea", "daily"], 40],
      ["Hojicha roasted tea, 80 g", "Roasted stems and leaves. Low caffeine, toasty and calming in the evening.", 1500, "Green tea", ["hojicha", "roasted", "low caffeine"], 32],
      ["Chasen whisk, 100 prongs", "Hand-carved bamboo whisk for preparing matcha.", 3200, "Teaware", ["whisk", "matcha", "bamboo", "teaware"], 10],
      ["Matcha starter kit", "30 g ceremonial matcha, chasen whisk, scoop and a guide card.", 7900, "Teaware", ["kit", "gift", "matcha", "starter"], 7],
    ],
  },
];

export async function seedDemo(q: Query) {
  const existing = await q("select count(*)::int as n from shops where is_demo = true");
  if (Number(existing[0]?.n) >= SHOPS.length) return;
  for (const s of SHOPS) {
    await q(
      `insert into shops (id, slug, name, tagline, about, city, country, currency, owner_key, ships_to, accent, is_demo, published)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,true) on conflict (id) do nothing`,
      [s.id, s.slug, s.name, s.tagline, s.about, s.city, s.country, s.currency, process.env.DEMO_OWNER_KEY || "demo", s.ships_to, s.accent],
    );
    let pos = 0;
    for (const [name, description, price, category, tags, stock] of s.products) {
      const id = `${s.id.replace("shop_", "p_")}_${pos}`;
      await q(
        `insert into products (id, shop_id, name, description, price_cents, currency, category, tags, stock, position, paypal_product_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) on conflict (id) do nothing`,
        [id, s.id, name, description, Math.round(price * 100), s.currency, category, tags, stock, pos, null],
      );
      pos++;
    }
  }
}
