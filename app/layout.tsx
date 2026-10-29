import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Azeret_Mono, Big_Shoulders } from "next/font/google";
import "./globals.css";

// Big Shoulders has an optical-size axis: large sizes get the tall, condensed display cut.
// Next has no fallback metrics for these two fonts, so the CSS font stacks provide the fallback.
const display = Big_Shoulders({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-display-face",
  adjustFontFallback: false,
});
const body = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body-face",
  adjustFontFallback: false,
});
const mono = Azeret_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-mono-face" });

export const metadata: Metadata = {
  title: "Weather in four places",
  description: "The weather right now in four places, turned into one AI-generated picture.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions (themes, assistants) add attributes to <html> before React loads;
    // this only ignores that mismatch on this one element, not in the rest of the page.
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
