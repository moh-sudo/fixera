import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fixera.africa"),
  title: "Fixera — One Call. We Fix It All.",
  description: "Kenya's trusted home services platform. Book plumbers, electricians, cleaners, painters, movers and more in minutes.",
  keywords: "home services Kenya, plumber Nairobi, electrician Nairobi, house cleaning, movers Kenya, Fixera",
  openGraph: {
    title: "Fixera — One Call. We Fix It All.",
    description: "Kenya's trusted home services platform.",
    url: "https://fixera.africa",
    siteName: "Fixera",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fixera — One Call. We Fix It All.",
    description: "Kenya's trusted home services platform.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-1998Q2XE8C" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1998Q2XE8C');
        `}</Script>
      </body>
    </html>
  );
}
