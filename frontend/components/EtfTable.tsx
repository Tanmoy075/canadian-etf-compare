"use client";

import { ETF } from "../lib/api";
import { CompareItem, loadCompare, saveCompare } from "../lib/compareStore";
import { useEffect, useState } from "react";

export function EtfTable({
  etfs,
  total,
  activeCurrency
}: {
  etfs: ETF[];
  total: number;
  activeCurrency?: "CAD" | "USD";
}) {
  const [basket, setBasket] = useState<CompareItem[]>([]);

  useEffect(() => {
    setBasket(loadCompare());
  }, []);

  useEffect(() => {
    saveCompare(basket);
  }, [basket]);

  const isInBasket = (ticker: string) =>
    basket.some((item) => item.ticker === ticker);

  const toggle = (etf: ETF) => {
    let next: CompareItem[];
    if (isInBasket(etf.ticker)) {
      next = basket.filter((i) => i.ticker !== etf.ticker);
    } else {
      if (basket.length >= 5) return;
      next = [
        ...basket,
        { ticker: etf.ticker, name: etf.name } satisfies CompareItem
      ];
    }
    setBasket(next);
    saveCompare(next); // persist immediately so Compare page sees it after navigation
  };

  return (
    <div className="card p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-bold text-[#111111]">{total} ETFs found</span>
        <span className="font-bold text-[#111111]">
          Compare ETFs: {basket.length} selected (up to 5).{" "}
          <a
            href={
              basket.length > 0
                ? `/compare?tickers=${basket.map((b) => b.ticker).join(",")}`
                : "/compare"
            }
            className="font-normal text-[#1D9E75] underline hover:text-accent-hover"
          >
            View comparison
          </a>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-sm font-semibold uppercase tracking-wide text-content-secondary">
            <tr>
              <th className="py-2 pr-4">ETF</th>
              <th className="py-2 px-4">Provider</th>
              <th className="py-2 px-4">Asset class</th>
              <th className="py-2 px-4">MER (%)</th>
              <th className="py-2 px-4">Yield (%)</th>
              <th className="py-2 px-4">Risk</th>
              <th className="py-2 pl-4 text-right">Compare</th>
            </tr>
          </thead>
          <tbody>
            {etfs.map((etf) => (
              <tr
                key={etf.ticker}
                className="border-b border-border last:border-0 hover:bg-primary"
              >
                <td className="py-2 pr-4 align-middle">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/etf/${etf.ticker}`}
                        className="text-base font-bold text-heading hover:text-accent"
                      >
                        {etf.ticker}
                      </a>
                      {activeCurrency === "USD" && (
                        <span className="rounded bg-[#0C447C] px-2 py-0.5 text-xs font-semibold text-white">
                          USD
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-content-primary">
                      {etf.name}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-4 text-sm font-semibold text-content-primary">
                  {etf.provider}
                </td>
                <td className="py-2 px-4 text-sm font-semibold text-content-primary">
                  {etf.asset_class}
                </td>
                <td className="py-2 px-4 text-sm font-semibold text-content-primary">
                  {etf.mer.toFixed(2)}
                </td>
                <td className="py-2 px-4 text-sm font-semibold text-content-primary">
                  {etf.distribution_yield.toFixed(2)}
                </td>
                <td className="py-2 px-4 text-sm font-semibold text-content-primary">
                  {etf.risk_rating}
                </td>
                <td className="py-2 pl-4 text-right">
                  <button
                    onClick={() => toggle(etf)}
                    className={
                      "rounded-full border px-3 py-1 text-xs font-semibold transition " +
                      (isInBasket(etf.ticker)
                        ? "border-accent bg-badge-bg text-badge-text"
                        : "border-border text-content-primary hover:border-accent hover:text-accent")
                    }
                  >
                    {isInBasket(etf.ticker) ? "In basket" : "Add to compare"}
                  </button>
                </td>
              </tr>
            ))}
            {etfs.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-sm text-content-secondary"
                >
                  No ETFs match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

