const shapes = [
  (c: string) => <circle cx="40" cy="44" r="22" fill={c} />,
  (c: string) => <rect x="20" y="22" width="40" height="44" rx="6" fill={c} />,
  (c: string) => <path d="M18 64 L40 20 L62 64 Z" fill={c} />,
  (c: string) => <ellipse cx="40" cy="48" rx="26" ry="16" fill={c} />,
  (c: string) => <rect x="26" y="16" width="28" height="52" rx="14" fill={c} />,
];

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function ProductArt({ name, accent, image, className = "" }: { name: string; accent: string; image?: string | null; className?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  }
  const h = hash(name);
  const tones = ["#f0e4d0", "#e6ecdf", "#efe0dc", "#e3e6ee", "#f1e9d6"];
  return (
    <svg viewBox="0 0 80 80" className={`h-full w-full ${className}`} aria-hidden>
      <rect width="80" height="80" fill={tones[h % tones.length]} />
      <g opacity=".92">{shapes[h % shapes.length](accent)}</g>
      <circle cx={20 + (h % 40)} cy={18 + ((h >> 3) % 10)} r="4" fill="#fbf8f2" opacity=".8" />
      <rect x="0" y="70" width="80" height="10" fill="#191714" opacity=".06" />
    </svg>
  );
}
