import { z } from "zod";
import { channel3Configured, channel3Supports, marketCheck } from "@/lib/channel3";

const Body = z.object({
  currency: z.string().length(3),
  country: z.string().max(80).nullish(),
  products: z.array(z.object({ name: z.string().min(1).max(200), category: z.string().max(80).optional() })).max(25),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request" }, { status: 400 });
  const { currency, country, products } = parsed.data;
  if (!channel3Configured()) return Response.json({ available: false, reason: "Market check is not configured." });
  if (!channel3Supports(currency)) return Response.json({ available: false, reason: `Market prices aren't available in ${currency} yet.` });
  try {
    return Response.json({ available: true, results: await marketCheck(products, currency, country) });
  } catch (e) {
    return Response.json({ available: false, reason: (e as Error).message }, { status: 502 });
  }
}
