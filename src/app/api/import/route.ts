import { limited, limitedAi, readJson } from "@/lib/guard";
import { draftFromSource } from "@/lib/importer";

export const maxDuration = 120;

export async function POST(req: Request) {
  const blocked = (await limited(req, "import")) || (await limitedAi(req));
  if (blocked) return blocked;
  const body = await readJson<{ url?: string; text?: string; image?: string }>(req, 7_500_000);
  if (!body) return Response.json({ error: "That upload is too large or unreadable." }, { status: 400 });
  let image: { data: string; mediaType: string } | undefined;
  if (body.image) {
    const m = body.image.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/);
    if (!m) return Response.json({ error: "Use a PNG, JPEG, WebP or GIF image." }, { status: 400 });
    if (m[2].length > 7_000_000) return Response.json({ error: "Image is too large (max ~5 MB)." }, { status: 400 });
    image = { mediaType: m[1], data: m[2] };
  }
  const url = typeof body.url === "string" ? body.url.trim().slice(0, 2000) : "";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 20_000) : "";
  try {
    const draft = await draftFromSource({ url: url || undefined, text: text || undefined, image });
    if (!draft.products.length) return Response.json({ error: "No priced items found. Try a menu photo or paste your price list." }, { status: 422 });
    return Response.json({ draft });
  } catch (e) {
    const msg = e instanceof Error && e.message.length < 160 && !/\n|\bat \S+:\d+/.test(e.message) ? e.message : "Import failed. Try pasting the price list instead.";
    return Response.json({ error: msg }, { status: 400 });
  }
}
