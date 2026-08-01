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

const siteUrl = "https://www.ajkelection2026quetta.com";
const title = "AJK Election 2026 Quetta";
const description =
  "حتمی انتخابی فہرست ۲۰۲۶ — کوئٹہ۔ نام یا شناختی کارڈ نمبر سے تلاش کریں۔ Final electoral roll search for Quetta / AJK.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  applicationName: title,
  keywords: [
    "AJK Election 2026",
    "Quetta",
    "electoral roll",
    "voter list",
    "CNIC search",
    "Mangla Dam",
    "آزاد جموں و کشمیر",
    "حتمی فہرست",
  ],
  authors: [{ name: "AJK Election Commission" }],
  creator: "AJK Election 2026 Quetta",
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: title,
    locale: "ur_PK",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AJK Election 2026 Quetta — Final Electoral Roll Search",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/twitter-image"],
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
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
