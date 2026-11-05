export function Ticker({ items }: { items: { name: string; shop: string; price: string; stock: number | null; image?: string | null }[] }) {
  if (!items.length) return null;
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-line py-3.5 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]" aria-hidden>
      <div className="marquee flex w-max gap-9">
        {row.map((p, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2.5 text-[14px]">
            {p.image ? <img src={p.image} alt="" className="h-7 w-7 rounded-full object-cover" loading="lazy" /> : <span className="h-1.5 w-1.5 rounded-full bg-laser" />}
            <span className="font-semibold">{p.name}</span>
            <span className="mono text-muted">{p.price}</span>
            {p.stock != null && <span className={`text-[12.5px] ${p.stock === 0 ? "text-muted line-through" : p.stock <= 3 ? "text-[#c2410c]" : "text-moss"}`}>{p.stock === 0 ? "sold out" : `${p.stock} left`}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
