import { createMCPClient } from "@ai-sdk/mcp";
import { convertToModelMessages, isStepCount, streamText, type UIMessage } from "ai";
import { model } from "@/lib/ai";
import { baseUrlFrom } from "@/lib/base-url";

export const maxDuration = 60;

export async function POST(req: Request) {
  const llm = model("smart");
  if (!llm) return Response.json({ error: "No AI key configured." }, { status: 503 });
  const { messages } = (await req.json()) as { messages: UIMessage[] };
  const base = process.env.SHELF_INTERNAL_URL || baseUrlFrom(req);
  const mcp = await createMCPClient({ transport: { type: "http", url: `${base}/mcp`, headers: { "x-agent-name": "Shelf demo agent" } } });
  const result = streamText({
    model: llm,
    system:
      "You are a personal shopping agent. You shop small independent stores through the Shelf MCP directory. Find what the user wants with search_all_products or find_shops, compare a few options briefly (price, shop, location, fulfilment), then create a checkout for the best match when the user asks you to buy or clearly wants it. After create_checkout, tell the user the total and that they need to approve in PayPal; the app shows them the button. Never say an order is paid unless get_order_status returns PAID. Keep replies short.",
    messages: await convertToModelMessages(messages),
    tools: await mcp.tools(),
    stopWhen: isStepCount(8),
    onFinish: () => mcp.close(),
    onError: () => mcp.close(),
  });
  return result.toUIMessageStreamResponse();
}
