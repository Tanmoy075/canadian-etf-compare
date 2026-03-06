"use client";

import { useCallback, useEffect, useState } from "react";
import { EtfFilters, FilterState } from "../components/EtfFilters";
import { EtfTable } from "../components/EtfTable";
import { ETF, ETFListResponse, fetchEtfs } from "../lib/api";

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [data, setData] = useState<ETFListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <EtfFilters onChange={setFilters} />
      {loading && (
        <div className="card p-4 text-sm text-slate-400">
          Loading ETFs...
        </div>
      )}
      {error && (
        <div className="card border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      {data && <EtfTable etfs={data.items as ETF[]} total={data.total} />}
    </div>
  );
}

