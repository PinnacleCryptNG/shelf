import { draftFromSource } from "@/lib/importer";

export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { url?: string; text?: string; image?: string };
  let image: { data: string; mediaType: string } | undefined;
  if (body.image) {
    const m = body.image.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
    if (!m) return Response.json({ error: "Unsupported image." }, { status: 400 });
    if (m[2].length > 7_000_000) return Response.json({ error: "Image is too large (max ~5 MB)." }, { status: 400 });
    image = { mediaType: m[1], data: m[2] };
  }
  try {
    const draft = await draftFromSource({ url: body.url?.trim() || undefined, text: body.text?.trim() || undefined, image });
    if (!draft.products.length) return Response.json({ error: "No priced items found. Try a menu photo or paste your price list." }, { status: 422 });
    return Response.json({ draft });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Import failed." }, { status: 400 });
  }
}
