import type { Metadata } from "next";
import { Header } from "@/components/header";
import { aiProvider, modelLabel } from "@/lib/ai";
import { AgentChat } from "./chat";

export const metadata: Metadata = { title: "Demo shopping agent", description: "Watch an AI agent find and buy from small shops through Shelf's MCP directory and PayPal." };

export default function Page() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-5 pb-10 sm:px-8">
        <AgentChat aiReady={aiProvider() !== null} model={modelLabel()} />
      </main>
    </>
  );
}
