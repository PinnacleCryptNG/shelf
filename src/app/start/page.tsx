import type { Metadata } from "next";
import { Header } from "@/components/header";
import { aiProvider } from "@/lib/ai";
import { Wizard } from "./wizard";

export const metadata: Metadata = { title: "Open your shop" };

export default function Start() {
  return (
    <>
      <Header right={<a href="/agents" className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink">How agents connect</a>} />
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 sm:px-8">
        <Wizard aiReady={aiProvider() !== null} />
      </main>
    </>
  );
}
