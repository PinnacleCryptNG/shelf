import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#f3eee4", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 34 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <div style={{ width: 34, height: 78, background: "#d9502b", borderRadius: 6 }} />
            <div style={{ width: 30, height: 56, background: "#1f4d3a", borderRadius: 6 }} />
            <div style={{ width: 30, height: 66, background: "#191714", borderRadius: 15 }} />
          </div>
          <div style={{ width: 138, height: 18, background: "#b98a5e", borderRadius: 4 }} />
        </div>
      </div>
    ),
    size,
  );
}
