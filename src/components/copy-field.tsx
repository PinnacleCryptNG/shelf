"use client";
import { useState } from "react";

export function CopyField({ value, label, tone = "light" }: { value: string; label?: string; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const [done, setDone] = useState(false);
  return (
    <div className={`flex items-center gap-2 rounded-xl border p-1.5 pl-3 ${dark ? "border-white/10 bg-white/5 text-white" : "border-line bg-card"}`}>
      {label && <span className={`shrink-0 text-xs ${dark ? "text-white/50" : "text-muted"}`}>{label}</span>}
      <code className="mono min-w-0 flex-1 truncate text-[13px]">{value}</code>
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1400); }}
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${dark ? "bg-white text-ink hover:bg-white/90" : "bg-ink text-white hover:bg-[#26282c]"}`}
      >
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
