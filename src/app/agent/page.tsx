import type { Metadata } from "next";
import { Header } from "@/components/header";
import { aiProvider, modelLabel } from "@/lib/ai";
import { AgentChat } from "./chat";

export const metadata: Metadata = { title: "Watch an agent shop", description: "A live AI agent searching small shops through Shelf's MCP directory. You approve every payment in PayPal." };

export default function Page() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl px-5 pb-10 sm:px-8">
        <AgentChat aiReady={aiProvider() !== null} model={modelLabel()} />
      </main>
    </>
  );
}
