import type { Metadata } from "next";
import { Anybody, Martian_Mono, Schibsted_Grotesk } from "next/font/google";
import { SvgDefs } from "@/components/svg-defs";
import "./globals.css";

// A wide-to-narrow display face for the few big words, a plain grotesque for reading, a mono for times and data.
// latin-ext covers ș, ă, ã, í; the wdth axis lets font-stretch narrow the headline and widen the wordmark.
const display = Anybody({ subsets: ["latin", "latin-ext"], axes: ["wdth"], variable: "--font-display-face" });
const body = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], style: ["normal", "italic"], variable: "--font-body-face" });
const mono = Martian_Mono({ subsets: ["latin", "latin-ext"], axes: ["wdth"], variable: "--font-mono-face" });

export const metadata: Metadata = {
  title: "Skypost",
  description: "Postcards of the sky in four places, right now: live weather and local time, painted into one picture.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions (themes, assistants) add attributes to <html> before React loads;
    // this only ignores that mismatch on this one element, not in the rest of the page.
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} antialiased`} suppressHydrationWarning>
      <body>
        <SvgDefs />
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
