"use client";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-5 text-center">
      <Link href="/" aria-label="Shelf home"><Logo /></Link>
      <p className="mono mt-12 text-sm text-[#ff4a24]">Scan failed</p>
      <h1 className="display mt-2 text-[2.4rem] leading-tight">Something went wrong.</h1>
      <p className="mt-3 max-w-sm text-muted">No payment was taken. Try again, and if it keeps happening, come back in a minute.</p>
      <div className="mt-8 flex gap-3"><button onClick={reset} className="btn btn-ink">Try again</button><Link href="/" className="btn btn-ghost">Go home</Link></div>
    </main>
  );
}
