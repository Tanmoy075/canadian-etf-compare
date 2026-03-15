"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { loadCompare } from "../lib/compareStore";

const tabClass =
  "rounded-lg border-2 border-[#0C447C] px-5 py-2 text-[15px] font-semibold transition-all duration-200 ease-in-out";

export function NavLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const isExplore = pathname === "/";
  const isCompare = pathname === "/compare";

  return (
    <nav className="flex gap-2">
      <Link
        href="/"
        className={
          isExplore
            ? `${tabClass} bg-[#0C447C] text-white`
            : `${tabClass} bg-white text-[#0C447C] hover:bg-[#E6F1FB] hover:text-[#0C447C]`
        }
      >
        Explore ETFs
      </Link>
      <Link
        href="/compare"
        className={
          isCompare
            ? `${tabClass} bg-[#0C447C] text-white`
            : `${tabClass} bg-white text-[#0C447C] hover:bg-[#E6F1FB] hover:text-[#0C447C]`
        }
        onClick={(e) => {
          const basket = loadCompare();
          if (basket.length > 0) {
            e.preventDefault();
            router.push(
              `/compare?tickers=${basket.map((b) => b.ticker).join(",")}`
            );
          }
        }}
      >
        Compare ETFs
      </Link>
    </nav>
  );
}
