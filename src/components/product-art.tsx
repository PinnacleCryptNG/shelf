function hash(s: string) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

const TONES = ["#ecebe5", "#e3ebe6", "#efe4df", "#e2e6ee", "#efeadc", "#e9e4ee"];
const INKS = ["#ff4a24", "#0d8a5c", "#c2410c", "#0f766e", "#0f1012", "#7c3aed", "#3f6212", "#1d4ed8"];

// Simple still-life shapes: loaf, jar, cup, bag, box, bottle, round, slice
const SHAPES: ((a: string, b: string) => React.ReactNode)[] = [
  (a, b) => (<><ellipse cx="60" cy="58" rx="34" ry="20" fill={a} /><path d="M38 52 q8 -6 16 0 M54 50 q8 -6 16 0 M70 52 q6 -4 10 0" stroke={b} strokeWidth="2.5" fill="none" strokeLinecap="round" /></>),
  (a, b) => (<><rect x="42" y="30" width="36" height="44" rx="6" fill={a} /><rect x="40" y="24" width="40" height="9" rx="3" fill={b} /><rect x="48" y="44" width="24" height="14" rx="2" fill="#ffffff" opacity=".85" /></>),
  (a, b) => (<><path d="M38 34 h40 l-5 40 h-30 z" fill={a} /><path d="M78 42 q12 2 10 14 q-2 10 -12 8" stroke={a} strokeWidth="5" fill="none" /><rect x="36" y="74" width="48" height="4" rx="2" fill={b} /></>),
  (a, b) => (<><path d="M36 36 h48 l4 40 h-56 z" fill={a} /><path d="M48 36 q0 -14 12 -14 q12 0 12 14" stroke={b} strokeWidth="4" fill="none" /></>),
  (a, b) => (<><rect x="30" y="38" width="60" height="36" rx="4" fill={a} /><rect x="56" y="38" width="8" height="36" fill={b} /><rect x="30" y="52" width="60" height="7" fill={b} /></>),
  (a, b) => (<><rect x="50" y="16" width="20" height="14" rx="3" fill={b} /><path d="M46 34 q0 -6 14 -6 q14 0 14 6 v40 h-28 z" fill={a} /><rect x="50" y="48" width="20" height="12" rx="2" fill="#ffffff" opacity=".85" /></>),
  (a, b) => (<><circle cx="60" cy="52" r="24" fill={a} /><circle cx="60" cy="52" r="10" fill={b} opacity=".9" /></>),
  (a, b) => (<><path d="M30 70 L60 28 L90 70 Z" fill={a} /><path d="M38 60 L82 60" stroke={b} strokeWidth="5" /></>),
];

export function ProductArt({ name, accent, image, className = "", eager = false }: { name: string; accent: string; image?: string | null; className?: string; eager?: boolean }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={`h-full w-full object-cover ${className}`} loading={eager ? "eager" : "lazy"} decoding="async" />;
  }
  const h = hash(name);
  const tone = TONES[h % TONES.length];
  const main = (h >>> 4) % 3 === 0 ? accent : INKS[(h >>> 6) % INKS.length];
  const second = INKS[(h >>> 9) % INKS.length] === main ? accent : INKS[(h >>> 9) % INKS.length];
  return (
    <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" className={`h-full w-full ${className}`} aria-hidden>
      <rect width="120" height="90" fill={tone} />
      <circle cx={18 + (h % 84)} cy={14 + ((h >>> 3) % 8)} r="5" fill="#ffffff" opacity=".7" />
      <rect x="0" y="78" width="120" height="12" fill="#0f1012" opacity=".05" />
      <ellipse cx="60" cy="78" rx="34" ry="3" fill="#0f1012" opacity=".08" />
      {SHAPES[(h >>> 12) % SHAPES.length](main, second)}
    </svg>
  );
}
