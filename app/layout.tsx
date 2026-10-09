import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "earthquery: ask the planet a question",
  description:
    "earthquery turns plain English into vector search over satellite imagery embeddings. Natural language satellite imagery search over geospatial tile embeddings, with an agent-friendly JSON API.",
  keywords: [
    "natural language satellite imagery search",
    "geospatial vector search",
    "earth observation",
    "remote sensing",
    "AlphaEarth",
    "EmbeddingGemma",
    "satellite embedding search",
  ],
  metadataBase: new URL("https://earthquery.nshipyard.com"),
  openGraph: {
    title: "earthquery: ask the planet a question",
    description:
      "Type 'solar farms in deserts' and get matching locations on a map, ranked by embedding similarity.",
    type: "website",
    url: "https://earthquery.nshipyard.com",
    images: [
      {
        url: "https://earthquery.nshipyard.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "earthquery: ask the planet a question",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "earthquery: ask the planet a question",
    description:
      "Type 'solar farms in deserts' and get matching locations on a map, ranked by embedding similarity.",
    images: ["https://earthquery.nshipyard.com/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[#0a0a0a]">{children}</body>
    </html>
  );
}
