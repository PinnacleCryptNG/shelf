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
  const cols: [string, [string, string][]][] = [
    ["Shops", [["Open your shop", "/start"], ["Fernhill Bakehouse", "/s/fernhill-bakehouse"], ["Kiln & Tide", "/s/kiln-and-tide"], ["Mori Tea Works", "/s/mori-tea-works"]]],
    ["Agents", [["Try the agent", "/agent"], ["MCP directory", "/agents"], ["llms.txt example", "/s/kiln-and-tide/llms.txt"]]],
    ["Project", [["GitHub", "https://github.com/PinnacleCryptNG/shelf"], ["PayPal AI Hackathon", "https://paypalaihackathon.devpost.com/"]]],
  ];
  return (
    <footer className="mt-32 bg-graphite px-5 pb-10 pt-16 text-ink sm:px-8">
      <div className="perf-top mx-auto w-full max-w-4xl bg-[#fbfaf6] px-6 pb-8 pt-10 sm:px-12">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <p className="mt-3 max-w-sm text-[14px] text-muted">Small shops, open to AI agents. Buyers approve every payment in PayPal.</p>
        </div>
        <div className="mt-10 grid gap-8 border-t border-dashed border-line pt-8 sm:grid-cols-3">
          {cols.map(([h, links]) => (
            <div key={h}>
              <p className="label">{h}</p>
              <ul className="mt-3 space-y-2 text-[14px]">
                {links.map(([t, href]) => (
                  <li key={t}>{href.startsWith("http") ? <a href={href} className="transition hover:text-laser">{t}</a> : <Link href={href} className="transition hover:text-laser">{t}</Link>}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-dashed border-line pt-6 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[.25em]">Thank you for shopping small</p>
          <div className="barcode mx-auto mt-4 w-56 text-ink/85" aria-hidden />
          <p className="mt-3 text-[12px] text-muted">Sandbox payments only · MIT licensed · PayPal AI Hackathon</p>
        </div>
      </div>
    </footer>
  );
}
