import { convertToModelMessages, isStepCount, streamText, type UIMessage } from "ai";
import { model } from "@/lib/ai";
import { copilotTools } from "@/lib/copilot";
import { isOwner } from "@/lib/owner";
import { getShop } from "@/lib/store";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const shop = await getShop((await params).slug);
  if (!shop || !(await isOwner(shop))) return Response.json({ error: "Not your shop." }, { status: 403 });
  const llm = model("smart");
  if (!llm) return Response.json({ error: "No AI key configured." }, { status: 503 });
  const { messages } = (await req.json()) as { messages: UIMessage[] };
  const result = streamText({
    model: llm,
    system: `You are the back-office copilot for ${shop.name} (${shop.city}, ${shop.country}; currency ${shop.currency}). The owner is busy; reply in short plain sentences. Use tools to look things up instead of guessing. You can add PayPal shipment tracking and issue PayPal refunds. Before any refund, state the order and amount and ask the owner to confirm; only call refund_order after they say yes. Today is ${new Date().toISOString().slice(0, 10)}.`,
    messages: await convertToModelMessages(messages),
    tools: copilotTools(shop),
    stopWhen: isStepCount(6),
  });
  return result.toUIMessageStreamResponse();
}
