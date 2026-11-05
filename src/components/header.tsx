import Link from "next/link";
import { Logo } from "./logo";

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" aria-label="Shelf home"><Logo /></Link>
      <nav className="flex items-center gap-1 text-sm sm:gap-2">
        {right ?? (
          <>
            <Link href="/agent" className="hidden rounded-full px-3 py-2 hover:bg-card sm:inline-block">Try the agent</Link>
            <Link href="/agents" className="hidden rounded-full px-3 py-2 hover:bg-card sm:inline-block">For agents</Link>
            <Link href="/start" className="btn btn-ink !py-2 !px-4 text-sm">Open your shop</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-6xl px-5 pb-10 text-sm text-muted sm:px-8">
      <div className="shelf-edge mb-6" />
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <p>Shelf · built for the PayPal AI Hackathon · payments run in the PayPal sandbox.</p>
        <div className="flex gap-4">
          <Link href="/agents" className="hover:text-ink">MCP directory</Link>
          <a href="https://github.com/PinnacleCryptNG/shelf" className="hover:text-ink">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
