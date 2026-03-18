import "./globals.css";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NavLinks } from "../components/NavLinks";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata = {
  title: "Canadian ETF Compare",
  description:
    "Search, filter, and compare Canadian-listed ETFs. Free tool for Canadian investors.",
  icons: {
    icon: "/icon",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="font-sans min-h-screen bg-primary text-content-primary">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
          <header className="mb-6 flex items-center justify-between gap-4 border-b-2 border-accent bg-card pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-heading">
                Canadian ETF Compare
              </h1>
              <p className="mt-1 text-sm text-content-secondary">
                Search, filter, and compare Canadian-listed ETFs.
              </p>
            </div>
            <NavLinks />
          </header>
          <main className="flex-1 pb-10">{children}</main>
          <footer className="mt-auto border-t border-border pt-4 text-xs text-content-secondary">
            <p>
              For educational use only. Not investment advice. Data may be delayed or incomplete.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
