import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Shelf: small shops, open to AI agents";

function Mark({ s = 64 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 32 32">
      <path d="M2.6 16 9.4 6.6c.4-.5 1-.8 1.6-.8H27a2.4 2.4 0 0 1 2.4 2.4v15.6a2.4 2.4 0 0 1-2.4 2.4H11c-.6 0-1.2-.3-1.6-.8Z" fill="#0f1012" />
      <circle cx="10.4" cy="16" r="2.3" fill="#f3f3ef" />
      <rect x="15.5" y="10.5" width="1.6" height="11" fill="#f3f3ef" />
      <rect x="18.6" y="10.5" width="3" height="11" fill="#f3f3ef" />
      <rect x="23.1" y="10.5" width="1.6" height="11" fill="#f3f3ef" />
      <rect x="13.5" y="15.1" width="17.5" height="1.8" rx=".9" fill="#ff4a24" />
    </svg>
  );
}

export default function OG() {
  const tags = [["Tide mug", "Kiln & Tide", "€32.00"], ["Sourdough loaf", "Fernhill Bakehouse", "£6.50"], ["Uji matcha, 30 g", "Mori Tea Works", "¥3,800"]];
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#f3f3ef", display: "flex", padding: 72, fontFamily: "sans-serif", color: "#0f1012" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 44, fontWeight: 700, letterSpacing: -2 }}><Mark s={56} />shelf</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 80, lineHeight: 1.02, fontWeight: 700, letterSpacing: -3 }}>Small shops,</div>
            <div style={{ display: "flex", fontSize: 80, lineHeight: 1.02, fontWeight: 700, letterSpacing: -3 }}>open to&nbsp;<span style={{ color: "#ff4a24" }}>AI agents.</span></div>
            <div style={{ marginTop: 28, fontSize: 28, lineHeight: 1.35, color: "#5f6268" }}>Any agent can search and buy. Every payment is approved by the buyer in PayPal.</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, marginLeft: 48, width: 388, background: "#15171a", borderRadius: 28, padding: 32, position: "relative" }}>
          {tags.map(([n, s, p], i) => (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: i === 0 ? "#ffffff" : "rgba(255,255,255,.07)", color: i === 0 ? "#0f1012" : "#f3f3ef", borderRadius: 16, padding: "18px 20px", border: i === 0 ? "3px solid #ff4a24" : "3px solid transparent" }}>
              <div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 24, fontWeight: 700 }}>{n}</div><div style={{ fontSize: 18, opacity: 0.55 }}>{s}</div></div>
              <div style={{ fontSize: 22 }}>{p}</div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "center", background: "#ffc439", color: "#0b1f44", borderRadius: 14, padding: "16px 0", fontSize: 22, fontWeight: 700 }}>Approve €32.00 in PayPal</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 112, height: 3, background: "#ff4a24", boxShadow: "0 0 18px #ff4a24" }} />
        </div>
      </div>
    ),
    size,
  );
}
