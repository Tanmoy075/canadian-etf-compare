"use client";

import { ETF } from "../lib/api";
import { CompareItem, loadCompare, saveCompare } from "../lib/compareStore";
import { useEffect, useState } from "react";

export function EtfTable({
  etfs,
  total
}: {
  etfs: ETF[];
  total: number;
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
        <div className="mb-3 flex items-center justify-between text-xs text-content-secondary">
        <span>{total} ETFs found</span>
        <span>
          Compare basket: {basket.length} selected (up to 5).{" "}
          <a
            href={
              basket.length > 0
                ? `/compare?tickers=${basket.map((b) => b.ticker).join(",")}`
                : "/compare"
            }
            className="text-accent-light underline"
          >
            View comparison
          </a>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-accent-light/15 text-xs uppercase text-content-secondary">
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
                className="border-b border-accent-light/15 last:border-0 hover:bg-secondary/40"
              >
                <td className="py-2 pr-4 align-middle">
                  <div className="flex flex-col">
                    <a
                      href={`/etf/${etf.ticker}`}
                      className="font-display text-sm font-medium text-content-primary hover:text-accent-light"
                    >
                      {etf.ticker}
                    </a>
                    <span className="font-display text-xs text-content-secondary">
                      {etf.name}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-4 text-xs text-content-secondary">
                  {etf.provider}
                </td>
                <td className="py-2 px-4 text-xs text-content-secondary">
                  {etf.asset_class}
                </td>
                <td className="py-2 px-4 text-xs text-content-primary">
                  {etf.mer.toFixed(2)}
                </td>
                <td className="py-2 px-4 text-xs text-content-primary">
                  {etf.distribution_yield.toFixed(2)}
                </td>
                <td className="py-2 px-4 text-xs text-content-primary">
                  {etf.risk_rating}
                </td>
                <td className="py-2 pl-4 text-right">
                  <button
                    onClick={() => toggle(etf)}
                    className={
                      "rounded-full border px-3 py-1 text-xs transition " +
                      (isInBasket(etf.ticker)
                        ? "border-accent-light bg-accent/20 text-accent-light"
                        : "border-accent/15 text-content-primary hover:border-accent-light")
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

