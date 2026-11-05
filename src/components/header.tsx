import Link from "next/link";
import { Logo } from "./logo";

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-paper/80 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" aria-label="Shelf home" className="rounded-md"><Logo /></Link>
        <nav className="flex items-center gap-1 text-[14px]">
          {right ?? (
            <>
              <Link href="/agent" className="hidden rounded-lg px-3 py-2 text-muted transition hover:text-ink sm:inline-block">Try the agent</Link>
              <Link href="/agents" className="hidden rounded-lg px-3 py-2 text-muted transition hover:text-ink sm:inline-block">For developers</Link>
              <Link href="/start" className="btn btn-ink ml-1 !px-3.5 !py-2 text-[14px]">Open your shop</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-28 bg-graphite text-[#f3f3ef]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-10 pt-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">Small shops, open to AI agents. Buyers approve every payment in PayPal.</p>
        </div>
        {[
          ["Shops", [["Open your shop", "/start"], ["Fernhill Bakehouse", "/s/fernhill-bakehouse"], ["Kiln & Tide", "/s/kiln-and-tide"]]],
          ["Agents", [["Try the agent", "/agent"], ["MCP directory", "/agents"], ["llms.txt example", "/s/kiln-and-tide/llms.txt"]]],
          ["Project", [["GitHub", "https://github.com/PinnacleCryptNG/shelf"], ["PayPal AI Hackathon", "https://paypalaihackathon.devpost.com/"]]],
        ].map(([h, links]) => (
          <div key={h as string}>
            <p className="label !text-white/40">{h as string}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {(links as string[][]).map(([t, href]) => (
                <li key={t}>{href.startsWith("http") ? <a href={href} className="text-white/75 transition hover:text-white">{t}</a> : <Link href={href} className="text-white/75 transition hover:text-white">{t}</Link>}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-2 border-t border-white/10 px-5 py-5 text-xs text-white/45 sm:flex-row sm:px-8">
        <p>Payments run in the PayPal sandbox. No real money moves.</p>
        <p>MIT licensed · Built for the PayPal AI Hackathon</p>
      </div>
    </footer>
  );
}
