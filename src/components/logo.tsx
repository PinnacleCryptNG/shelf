/** Shelf mark: a price tag read by a scanner line. */
export function LogoMark({ size = 28, tone = "ink" }: { size?: number; tone?: "ink" | "light" }) {
  const body = tone === "ink" ? "#0f1012" : "#f3f3ef";
  const cut = tone === "ink" ? "#f3f3ef" : "#15171a";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M2.6 16 9.4 6.6c.4-.5 1-.8 1.6-.8H27a2.4 2.4 0 0 1 2.4 2.4v15.6a2.4 2.4 0 0 1-2.4 2.4H11c-.6 0-1.2-.3-1.6-.8Z" fill={body} />
      <circle cx="10.4" cy="16" r="2.3" fill={cut} />
      <rect x="15.5" y="10.5" width="1.6" height="11" rx=".5" fill={cut} />
      <rect x="18.6" y="10.5" width="3" height="11" rx=".5" fill={cut} />
      <rect x="23.1" y="10.5" width="1.6" height="11" rx=".5" fill={cut} />
      <rect x="13.5" y="15.1" width="17.5" height="1.8" rx=".9" fill="#ff4a24" />
    </svg>
  );
}

export function Logo({ size = 26, tone = "ink" }: { size?: number; tone?: "ink" | "light" }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} tone={tone} />
      <span className="display text-[1.3rem] leading-none tracking-[-0.04em]">shelf</span>
    </span>
  );
}
