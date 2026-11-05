export function baseUrlFrom(req: Request | Headers) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = req instanceof Request ? req.headers : req;
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function agentNameFrom(req: Request) {
  const url = new URL(req.url);
  const explicit = url.searchParams.get("agent") || req.headers.get("x-agent-name");
  if (explicit) return explicit.replace(/[^\p{L}\p{N} ._()-]/gu, "").trim().slice(0, 40) || "An AI agent";
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  if (ua.includes("claude")) return "Claude";
  if (ua.includes("openai") || ua.includes("chatgpt")) return "ChatGPT";
  if (ua.includes("cursor")) return "Cursor";
  if (ua.includes("gemini") || ua.includes("google")) return "Gemini";
  return "An AI agent";
}
