export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="5" y="5" width="7" height="15" rx="1.5" fill="#d9502b" />
      <rect x="13.5" y="9" width="6" height="11" rx="1.5" fill="#1f4d3a" />
      <rect x="21" y="7" width="6" height="13" rx="3" fill="#191714" />
      <rect x="2" y="21" width="28" height="4" rx="1" fill="#b98a5e" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="display text-[1.45rem] font-semibold leading-none">Shelf</span>
    </span>
  );
}
