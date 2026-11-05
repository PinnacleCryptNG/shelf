import type { Metadata } from "next";
import { Header } from "@/components/header";
import { aiProvider, modelLabel } from "@/lib/ai";
import { AgentChat } from "./chat";

export const metadata: Metadata = { title: "Watch an agent shop", description: "A live AI agent searching small shops through Shelf's MCP directory. You approve every payment in PayPal." };

export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const order = (await searchParams).order;
  const resume = order && /^ord_[A-Za-z0-9_-]{4,40}$/.test(order) ? order : null;
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl px-5 pb-10 sm:px-8">
        <AgentChat aiReady={aiProvider() !== null} model={modelLabel()} resumeOrder={resume} />
      </main>
    </>
  );
}
