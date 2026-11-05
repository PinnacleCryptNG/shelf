import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#0f1012", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="132" height="132" viewBox="0 0 32 32">
          <path d="M2.6 16 9.4 6.6c.4-.5 1-.8 1.6-.8H27a2.4 2.4 0 0 1 2.4 2.4v15.6a2.4 2.4 0 0 1-2.4 2.4H11c-.6 0-1.2-.3-1.6-.8Z" fill="#f3f3ef" />
          <circle cx="10.4" cy="16" r="2.3" fill="#0f1012" />
          <rect x="15.5" y="10.5" width="1.6" height="11" fill="#0f1012" />
          <rect x="18.6" y="10.5" width="3" height="11" fill="#0f1012" />
          <rect x="23.1" y="10.5" width="1.6" height="11" fill="#0f1012" />
          <rect x="13.5" y="15.1" width="17.5" height="1.8" rx=".9" fill="#ff4a24" />
        </svg>
      </div>
    ),
    size,
  );
}
