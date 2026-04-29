"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EtfFilters, FilterState } from "../components/EtfFilters";
import { EtfTable } from "../components/EtfTable";
import { ETF, ETFListResponse, fetchEtfs } from "../lib/api";

type MarketTab = "CAD" | "USD";

function EtfTableSkeleton() {
  // Roughly matches the height of the real table (header + ~12 rows) to prevent CLS.
  const rows = Array.from({ length: 12 });
  return (
    <div className="card p-4" aria-busy="true" aria-live="polite">
      <div className="mb-3 h-5 w-[420px] max-w-full animate-pulse rounded bg-border" />
      <div className="overflow-x-auto">
        <div className="min-h-[560px]">
          <div className="h-9 w-full animate-pulse rounded bg-border" />
          <div className="mt-2 space-y-2">
            {rows.map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded bg-border"
              />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading ETFs…</span>
    </div>
  );
}

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
    // Canadian ETFs - show everything that is NOT USD
    const isCanadian = (etf: any) => etf.currency !== "USD";
    // US ETFs - show only explicit USD
    const isUS = (etf: any) => etf.currency === "USD";
    return activeTab === "CAD" ? items.filter(isCanadian) : items.filter(isUS);
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
      {error && (
        <div className="card border-negative bg-negative/10 p-4 text-sm text-negative">
          {error}
        </div>
      )}
      <div className="min-h-[560px]">
        {loading && <EtfTableSkeleton />}
        {!loading && data && (
          <EtfTable
            etfs={[...(tabbedItems as ETF[])].sort((a, b) =>
              a.ticker.localeCompare(b.ticker)
            )}
            total={tabbedTotal}
            activeCurrency={activeTab}
          />
        )}
      </div>
    </div>
  );
}

