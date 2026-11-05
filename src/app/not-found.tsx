import Link from "next/link";
import { Header } from "@/components/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-xl flex-col items-center px-5 pb-24 pt-14 text-center">
        <div className="relative w-full max-w-xs" aria-hidden>
          <div className="relative grid h-28 grid-cols-3 items-end gap-3 overflow-hidden px-6">
            <div className="h-20 rounded-t-lg bg-ink" />
            <div className="sway h-14 rounded-t-lg border-2 border-dashed border-muted/40" />
            <div className="h-16 rounded-t-lg bg-[#e2e2db]" />
            <span className="scan-line [animation-iteration-count:infinite] [animation-duration:2.4s]" />
          </div>
          <div className="h-1.5 rounded-full bg-ink" />
        </div>
        <p className="mono mt-10 text-sm text-[#ff4a24]">404 · no match</p>
        <h1 className="display mt-2 text-[2.6rem] leading-tight">This shelf is empty.</h1>
        <p className="mt-3 max-w-sm text-muted">The page isn&apos;t here, or the shop hasn&apos;t been published yet.</p>
        <div className="mt-8 flex gap-3"><Link href="/" className="btn btn-ink">Go home</Link><Link href="/start" className="btn btn-ghost">Open a shop</Link></div>
      </main>
    </>
  );
}
