import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import "@/styles/global.css";

/**
 * Two families on a real contrast axis: a high-contrast editorial serif for
 * titles and the wordmark, a neutral grotesk for everything an operator reads
 * while working. Mono is reserved for identifiers and measured values.
 */
const displaySerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-serif-display",
});

const uiSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-ui",
});

const technicalMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-technical",
});

export const metadata: Metadata = {
  title: { default: "Shivayonic Command Center", template: "%s · Shivayonic Command Center" },
  description: "Private operating platform for Shivayonic Invites.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${displaySerif.variable} ${uiSans.variable} ${technicalMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
