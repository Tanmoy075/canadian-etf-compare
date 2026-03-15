"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadCompare } from "../lib/compareStore";

export function CompareBasketLink() {
  const router = useRouter();

  return (
    <Link
      href="/compare"
      className="btn-secondary"
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
  );
}
