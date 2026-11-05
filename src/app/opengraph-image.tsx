import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Shelf — let AI agents shop at your shop";

export default function OG() {
  const books = [["#d9502b", 150], ["#1f4d3a", 110], ["#b45309", 130], ["#0f766e", 96], ["#191714", 140], ["#d9502b", 104]] as const;
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#f3eee4", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", fontFamily: "Georgia, serif", color: "#191714" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 700 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
            <div style={{ width: 14, height: 30, background: "#d9502b", borderRadius: 3 }} />
            <div style={{ width: 12, height: 22, background: "#1f4d3a", borderRadius: 3 }} />
            <div style={{ width: 12, height: 26, background: "#191714", borderRadius: 6 }} />
          </div>
          Shelf
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, lineHeight: 1, fontWeight: 700, letterSpacing: -2 }}>Let AI agents shop</div>
          <div style={{ display: "flex", fontSize: 92, lineHeight: 1.05, fontWeight: 700, letterSpacing: -2 }}>at&nbsp;<span style={{ color: "#d9502b", fontStyle: "italic" }}>your</span>&nbsp;shop.</div>
          <div style={{ marginTop: 26, fontSize: 30, color: "#6b645a", fontFamily: "sans-serif" }}>Website, Instagram or menu photo → a catalogue Claude & ChatGPT can buy from, paid with PayPal.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, paddingLeft: 40 }}>
            {books.map(([c, h], i) => <div key={i} style={{ width: 64, height: h / 1.6, background: c, borderRadius: 6 }} />)}
          </div>
          <div style={{ height: 18, background: "#b98a5e", borderRadius: 4 }} />
        </div>
      </div>
    ),
    size,
  );
}
