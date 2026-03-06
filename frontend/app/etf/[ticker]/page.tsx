"use client";

import { useEffect, useState } from "react";
import { ETFDetail, fetchEtfDetail } from "../../../lib/api";
import { EtfDetailView } from "../../../components/EtfDetailView";
import { useParams } from "next/navigation";

export default function EtfDetailPage() {
  const params = useParams<{ ticker: string }>();
  const ticker = params?.ticker;

  const [data, setData] = useState<ETFDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchEtfDetail(ticker);
        setData(res);
      } catch (e) {
        console.error(e);
        setError("Failed to load ETF details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ticker]);

  if (!ticker) {
    return (
      <div className="card p-4 text-sm text-slate-400">
        Invalid ETF ticker.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-4 text-sm text-slate-400">
        Loading ETF details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-4 text-sm text-slate-400">
        ETF not found.
      </div>
    );
  }

  return <EtfDetailView etf={data} />;
}

