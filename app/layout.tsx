import type { Metadata } from "next";
import { Noto_Nastaliq_Urdu, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AJK Election 2026 Quetta",
  description:
    "حتمی انتخابی فہرست ۲۰۲۶ — کوئٹہ۔ شناختی کارڈ نمبر سے تلاش کریں۔ Final electoral roll search for Quetta.",
  metadataBase: new URL("https://ajkelection2026quetta.com"),
  openGraph: {
    title: "AJK Election 2026 Quetta",
    description: "Search the final electoral roll by CNIC — Quetta / AJK 2026",
    url: "https://ajkelection2026quetta.com",
    siteName: "AJK Election 2026 Quetta",
    locale: "ur_PK",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ur"
      dir="rtl"
      className={`${outfit.variable} ${nastaliq.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
