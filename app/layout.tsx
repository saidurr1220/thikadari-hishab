import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-bengali",
  display: "swap",
});

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "ঠিকাদারি হিসাব - Construction Contractor Accounting",
  description:
    "Complete accounting system for Bangladeshi construction contractors",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className={notoSansBengali.variable}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
