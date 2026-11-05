import { CORS, handleMcp } from "@/lib/mcp";
import { getShop } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const shop = await getShop((await params).slug);
  if (!shop || !shop.published) return Response.json({ error: "Shop not found" }, { status: 404 });
  return handleMcp(req, shop);
}

export const POST = handle;
export const GET = handle;
export const DELETE = () => new Response(null, { status: 405 });
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
