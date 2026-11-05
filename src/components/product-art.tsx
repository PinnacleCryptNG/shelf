export function ProductArt({ name, image, className = "", eager = false, credit }: { name: string; accent?: string; image?: string | null; className?: string; eager?: boolean; credit?: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" title={credit ? `Photo: ${credit}` : undefined} className={`h-full w-full object-cover ${className}`} loading={eager ? "eager" : "lazy"} decoding="async" />;
  }
  return (
    <div className={`grid h-full w-full place-items-center bg-[#ecebe5] p-4 text-center ${className}`} aria-hidden>
      <span className="text-[13px] font-semibold leading-snug text-ink/45">{name}<span className="mt-1 block text-[11px] font-medium uppercase tracking-[.12em] text-ink/30">Photo coming soon</span></span>
    </div>
  );
}
