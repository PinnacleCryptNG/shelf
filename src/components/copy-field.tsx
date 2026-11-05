"use client";
import { useState } from "react";

export function CopyField({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-card p-1.5 pl-3">
      {label && <span className="shrink-0 text-xs text-muted">{label}</span>}
      <code className="mono min-w-0 flex-1 truncate text-[13px]">{value}</code>
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1400); }}
        className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-card"
      >
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
