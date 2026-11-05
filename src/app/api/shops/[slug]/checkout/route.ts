import { z } from "zod";
import { baseUrlFrom } from "@/lib/base-url";
import { CheckoutError, createCheckout, getShop } from "@/lib/store";

const Body = z.object({ items: z.array(z.object({ product_id: z.string(), quantity: z.number().int().min(1).max(50) })).min(1).max(30), note: z.string().max(200).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const shop = await getShop((await params).slug);
  if (!shop?.published) return Response.json({ error: "Shop not found." }, { status: 404 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Your basket looks empty." }, { status: 400 });
  try {
    const out = await createCheckout({ shop, items: body.data.items, channel: "web", note: body.data.note, base: baseUrlFrom(req) });
    return Response.json(out);
  } catch (e) {
    if (e instanceof CheckoutError) return Response.json({ error: e.message }, { status: 409 });
    throw e;
  }
}
