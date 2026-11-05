import Link from "next/link";
import { Header } from "@/components/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-xl flex-col items-center px-5 pb-24 pt-16 text-center">
        <div className="w-full max-w-sm">
          <div className="flex items-end justify-center gap-3 px-6">
            <div className="h-16 w-10 rounded-t-md bg-tomato" />
            <div className="sway h-10 w-10 rounded-t-md border-2 border-dashed border-muted/50" />
            <div className="h-12 w-10 rounded-t-md bg-moss" />
          </div>
          <div className="shelf-edge" />
        </div>
        <h1 className="display mt-10 text-5xl font-semibold">This shelf is empty.</h1>
        <p className="mt-3 text-muted">The page you wanted isn&apos;t here, or the shop hasn&apos;t been published yet.</p>
        <div className="mt-8 flex gap-3"><Link href="/" className="btn btn-ink">Go home</Link><Link href="/start" className="btn btn-ghost">Open a shop</Link></div>
      </main>
    </>
  );
}
