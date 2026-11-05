export function Ticker({ items }: { items: { name: string; shop: string; price: string; stock: number | null }[] }) {
  if (!items.length) return null;
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-line bg-card py-3 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]" aria-hidden>
      <div className="marquee flex w-max gap-3">
        {row.map((p, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2.5 rounded-full border border-line py-1.5 pl-2 pr-3.5 text-[13px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4a24]" />
            <span className="font-medium">{p.name}</span>
            <span className="text-muted">{p.shop}</span>
            <span className="mono text-[12px]">{p.price}</span>
            {p.stock != null && <span className={`mono text-[11px] ${p.stock === 0 ? "text-muted line-through" : p.stock <= 3 ? "text-[#c2410c]" : "text-moss"}`}>{p.stock === 0 ? "sold out" : `${p.stock} left`}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
