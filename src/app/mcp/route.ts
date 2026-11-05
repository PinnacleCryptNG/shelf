import { CORS, handleMcp } from "@/lib/mcp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = (req: Request) => handleMcp(req);
export const GET = (req: Request) => handleMcp(req);
export const DELETE = () => new Response(null, { status: 405 });
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
