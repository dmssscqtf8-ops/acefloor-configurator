import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteOrigin } from "../lib/site";
import "./globals.css";

const siteOrigin = getSiteOrigin();
const socialImageUrl = siteOrigin
  ? new URL("/media/acetrax-black.jpeg", siteOrigin).toString()
  : null;

export const metadata: Metadata = {
  metadataBase: siteOrigin ?? undefined,
  title: {
    default: "AceFloor | Tuiles de garage modulaires premium",
    template: "%s | AceFloor",
  },
  description:
    "AceFloor conçoit des tuiles de garage modulaires premium et un configurateur interactif pour comparer les gammes, visualiser le plan et estimer rapidement un projet.",
  applicationName: "AceFloor Configurator",
  authors: [{ name: "AceFloor" }],
  creator: "AceFloor",
  publisher: "AceFloor",
  category: "home improvement",
  keywords: [
    "tuiles de garage",
    "dalles de garage",
    "garage flooring tiles",
    "revetement de garage modulaire",
    "configurateur garage",
    "sol de garage premium",
    "AceFloor",
  ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  referrer: "origin-when-cross-origin",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    type: "website",
    locale: "fr_CA",
    siteName: "AceFloor",
    title: "AceFloor | Tuiles de garage modulaires premium",
    description:
      "Dessinez votre garage, comparez les gammes AceFloor et obtenez un estimatif rapide avec le configurateur interactif.",
    images: socialImageUrl
      ? [
          {
            url: socialImageUrl,
            alt: "Tuile modulaire AceFloor noire",
          },
        ]
      : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: "AceFloor | Tuiles de garage modulaires premium",
    description:
      "Configurateur interactif de tuiles de garage modulaires pour garages, showrooms et ateliers.",
    images: socialImageUrl ? [socialImageUrl] : undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr-CA">
      <body>{children}</body>
    </html>
  );
}
