"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EtfFilters, FilterState } from "../components/EtfFilters";
import { EtfTable } from "../components/EtfTable";
import { ETF, ETFListResponse, fetchEtfs } from "../lib/api";

type MarketTab = "CAD" | "USD";

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [data, setData] = useState<ETFListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MarketTab>("CAD");

  const load = useCallback(
    async (f: FilterState | null) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchEtfs({
          q: f?.q || undefined,
          provider: f?.provider || undefined,
          asset_class: f?.asset_class || undefined,
          risk_rating: f?.risk_rating || undefined,
          min_mer: f?.min_mer ? Number(f.min_mer) : undefined,
          max_mer: f?.max_mer ? Number(f.max_mer) : undefined,
          min_yield: f?.min_yield ? Number(f.min_yield) : undefined,
          max_yield: f?.max_yield ? Number(f.max_yield) : undefined,
          limit: 100,
          offset: 0
        });
        setData(res);
      } catch (e) {
        console.error(e);
        setError("Failed to load ETFs. Check API base URL.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  const tabbedItems = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((etf) => etf.currency === activeTab);
  }, [data, activeTab]);

  const tabbedTotal = tabbedItems.length;

  return (
    <div className="space-y-4">
      <EtfFilters onChange={setFilters} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("CAD")}
          className={
            "rounded-lg border-2 border-[#0C447C] px-5 py-2 text-[15px] font-semibold transition-all duration-200 ease-in-out " +
            (activeTab === "CAD"
              ? "bg-[#0C447C] text-white"
              : "bg-transparent text-[#0C447C] hover:bg-[#E6F1FB] hover:text-[#0C447C]")
          }
        >
          🇨🇦 Canadian ETFs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("USD")}
          className={
            "rounded-lg border-2 border-[#0C447C] px-5 py-2 text-[15px] font-semibold transition-all duration-200 ease-in-out " +
            (activeTab === "USD"
              ? "bg-[#0C447C] text-white"
              : "bg-transparent text-[#0C447C] hover:bg-[#E6F1FB] hover:text-[#0C447C]")
          }
        >
          🇺🇸 Top US ETFs
        </button>
      </div>
      {loading && (
        <div className="card p-4 text-sm text-content-secondary">
          Loading ETFs...
        </div>
      )}
      {error && (
        <div className="card border-negative bg-negative/10 p-4 text-sm text-negative">
          {error}
        </div>
      )}
      {data && (
        <EtfTable
          etfs={[...(tabbedItems as ETF[])].sort((a, b) =>
            a.ticker.localeCompare(b.ticker)
          )}
          total={tabbedTotal}
          activeCurrency={activeTab}
        />
      )}
    </div>
  );
}

