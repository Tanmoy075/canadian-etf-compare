import "./globals.css";
import type { ReactNode } from "react";
import { Playfair_Display, IBM_Plex_Sans } from "next/font/google";
import { CompareBasketLink } from "../components/CompareBasketLink";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex",
});

export const metadata = {
  title: "Canadian ETF Compare",
  description: "Minimalist comparison tool for Canadian ETFs"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${ibmPlexSans.variable}`}>
      <body className="font-sans min-h-screen bg-primary text-content-primary">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
          <header className="mb-6 flex items-center justify-between gap-4 border-b border-accent-light/15 pb-4">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-content-primary">
                Canadian ETF Compare
              </h1>
              <p className="mt-1 text-sm text-content-secondary">
                Search, filter, and compare Canadian-listed ETFs.
              </p>
            </div>
            <nav className="flex gap-2 text-sm">
              <a href="/" className="btn-secondary">
                Explore ETFs
              </a>
              <CompareBasketLink />
            </nav>
          </header>
          <main className="flex-1 pb-10">{children}</main>
          <footer className="mt-auto border-t border-accent-light/15 pt-4 text-xs text-content-secondary">
            <p>
              For educational use only. Not investment advice. Data may be delayed or incomplete.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
