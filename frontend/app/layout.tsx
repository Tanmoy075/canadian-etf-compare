import "./globals.css";
import type { ReactNode } from "react";
import { CompareBasketLink } from "../components/CompareBasketLink";

export const metadata = {
  title: "Canadian ETF Compare",
  description: "Minimalist comparison tool for Canadian ETFs"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
          <header className="mb-6 flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-50">
                Canadian ETF Compare
              </h1>
              <p className="mt-1 text-sm text-slate-400">
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
          <footer className="mt-auto border-t border-slate-900 pt-4 text-xs text-slate-500">
            <p>
              For educational use only. Not investment advice. Data may be delayed or incomplete.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

