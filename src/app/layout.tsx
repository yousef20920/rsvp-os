import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { invitations, previewImageUrl, siteUrl } from "@/lib/invitations";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Wedding RSVP",
  description: "The wedding of Osama & Nour — You're invited.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Wedding RSVP",
    description: "The wedding of Osama & Nour — You're invited.",
    url: "/",
    siteName: "Osama & Nour Wedding",
    type: "website",
    images: [
      {
        url: previewImageUrl(invitations.women.images.en),
        width: 1200,
        height: 1680,
        alt: "Osama and Nour wedding invitation"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding RSVP",
    description: "The wedding of Osama & Nour — You're invited.",
    images: [previewImageUrl(invitations.women.images.en)]
  }
};

export const viewport: Viewport = {
  themeColor: "#f7f2ed",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
