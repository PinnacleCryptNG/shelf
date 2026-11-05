import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Schibsted_Grotesk({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Shelf · Small shops, open to AI agents", template: "%s · Shelf" },
  description:
    "Shelf turns a small shop's website, Instagram or menu photo into a catalogue that AI agents like Claude and ChatGPT can search and buy from. Every payment is approved by the buyer in PayPal.",
  openGraph: { siteName: "Shelf", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#f3f3ef" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} min-h-dvh overflow-x-clip`}>{children}</body>
    </html>
  );
}
