import "server-only";
import { createHash } from "node:crypto";
import { sql } from "./db";

export function clientIp(req: Request) {
  const h = req.headers;
  return (h.get("x-vercel-forwarded-for") || h.get("x-real-ip") || h.get("x-forwarded-for") || "local").split(",")[0].trim().slice(0, 64);
}

export async function hit(key: string, max: number, windowSec: number) {
  const rows = await sql<{ count: number }>(
    `insert into rate_limits (key, window_start, count) values ($1, now(), 1)
     on conflict (key) do update set
       count = case when rate_limits.window_start < now() - make_interval(secs => $2::float8) then 1 else rate_limits.count + 1 end,
       window_start = case when rate_limits.window_start < now() - make_interval(secs => $2::float8) then now() else rate_limits.window_start end
     returning count`,
    [key, windowSec],
  );
  if (Math.random() < 0.01) await sql("delete from rate_limits where window_start < now() - interval '2 days'");
  return (rows[0]?.count ?? 0) <= max;
}

const LIMITS = {
  ai: [20, 600],
  import: [8, 3600],
  create: [6, 3600],
  publish: [12, 3600],
  checkout: [20, 600],
  mcp: [120, 60],
  owner: [20, 600],
} as const;

export type Bucket = keyof typeof LIMITS;

export const tooMany = () =>
  Response.json({ error: "Too many requests. Try again in a little while." }, { status: 429, headers: { "retry-after": "60" } });

export async function allow(req: Request, bucket: Bucket) {
  const [max, win] = LIMITS[bucket];
  return hit(`${bucket}:${clientIp(req)}`, max, win);
}

export async function limited(req: Request, bucket: Bucket) {
  return (await allow(req, bucket)) ? null : tooMany();
}

const AI_DAILY = Number(process.env.SHELF_AI_DAILY_LIMIT || 1500);

export async function limitedAi(req: Request) {
  if (!(await allow(req, "ai"))) return tooMany();
  if (!(await hit(`ai-day:${new Date().toISOString().slice(0, 10)}`, AI_DAILY, 86400))) {
    return Response.json({ error: "The demo has reached today's AI limit. Please come back tomorrow." }, { status: 429 });
  }
  return null;
}

export const internalToken = () =>
  createHash("sha256").update(`shelf-internal:${process.env.SHELF_INTERNAL_SECRET || process.env.PAYPAL_CLIENT_SECRET || "dev"}`).digest("hex");

export const isInternal = (req: Request) => req.headers.get("x-shelf-internal") === internalToken();

export async function readJson<T = unknown>(req: Request, maxBytes: number): Promise<T | null> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > maxBytes) return null;
  const text = await req.text().catch(() => "");
  if (!text || text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
