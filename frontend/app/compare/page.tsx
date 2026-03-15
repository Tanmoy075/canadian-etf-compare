"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ETF, ETFDetail, fetchCompare, fetchEtfs } from "../../lib/api";
import { CompareItem, loadCompare, saveCompare } from "../../lib/compareStore";

const PERFORMANCE_PERIODS = ["1Y", "3Y", "5Y", "Since Inception"];
const CHART_COLORS = ["#0C447C", "#1D9E75", "#378ADD", "#0F6E56", "#B5D4F4"];
const SLOT_COUNT = 5;

function getInitialSlots(searchParams: URLSearchParams): (CompareItem | null)[] {
  const tickers = searchParams.get("tickers");
  let items: CompareItem[];
  if (tickers && typeof tickers === "string") {
    const list = tickers.split(",").map((t) => t.trim()).filter(Boolean);
    items = list.slice(0, SLOT_COUNT).map((ticker) => ({ ticker, name: ticker }));
  } else {
    items = loadCompare();
  }
  const slots: (CompareItem | null)[] = Array(SLOT_COUNT).fill(null);
  items.forEach((item, i) => {
    if (i < SLOT_COUNT) slots[i] = item;
  });
  return slots;
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const [slots, setSlots] = useState<(CompareItem | null)[]>(() =>
    getInitialSlots(searchParams)
  );
  const [data, setData] = useState<ETFDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSearchIndex, setOpenSearchIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ETF[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Stable derived state: only changes when confirmed selection changes (not on search keystrokes)
  const basket = useMemo(
    () => slots.filter((s): s is CompareItem => s != null),
    [slots]
  );
  const selectedTickers = useMemo(
    () => new Set(basket.map((b) => b.ticker)),
    [basket]
  );

  // Stable string key for confirmed tickers — used as dependency so fetch only runs when selection actually changes
  const confirmedTickersKey = useMemo(
    () =>
      slots
        .filter((s): s is CompareItem => s != null)
        .map((s) => s.ticker)
        .sort()
        .join(","),
    [slots]
  );
  // Sync URL and storage when confirmed selection changes (stable key)
  const orderedTickerKey = useMemo(
    () => basket.map((b) => b.ticker).join(","),
    [basket]
  );
  useEffect(() => {
    saveCompare(basket);
    const url = orderedTickerKey ? `/compare?tickers=${orderedTickerKey}` : "/compare";
    window.history.replaceState(null, "", url);
  }, [orderedTickerKey, basket]);

  // Fetch comparison data — only depends on confirmed tickers, not search input
  const fetchComparisonData = useCallback(async (tickers: string[]) => {
    if (tickers.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCompare(tickers);
      setData(res.items);
    } catch (e) {
      console.error(e);
      setError("Could not load comparison data. Please try again.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load comparison data only when confirmed tickers change, with 300ms debounce
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
      fetchDebounceRef.current = null;
    }
    const tickers = confirmedTickersKey ? confirmedTickersKey.split(",") : [];
    if (tickers.length < 2) {
      setData([]);
      setError(null);
      return;
    }
    fetchDebounceRef.current = setTimeout(() => {
      fetchDebounceRef.current = null;
      fetchComparisonData(tickers);
    }, 300);
    return () => {
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
      }
    };
  }, [confirmedTickersKey, fetchComparisonData]);

  // Search API when query changes
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetchEtfs({ q: q.trim(), limit: 20, offset: 0 });
      setSearchResults(res.items);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (openSearchIndex === null) return;
    searchTimeoutRef.current = setTimeout(() => {
      runSearch(searchQuery);
    }, 200);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, openSearchIndex, runSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenSearchIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setSlot = (index: number, item: CompareItem | null) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = item;
      return next;
    });
    setOpenSearchIndex(null);
    setSearchQuery("");
  };

  const removeByTicker = (ticker: string) => {
    setSlots((prev) =>
      prev.map((s) => (s && s.ticker === ticker ? null : s))
    );
  };

  const filteredSearchResults = searchResults.filter(
    (etf) => !selectedTickers.has(etf.ticker)
  );
  const isMaxReached = basket.length >= SLOT_COUNT;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-2xl font-bold text-heading">
          Compare ETFs
        </h2>
        <p className="mt-1 text-xs text-content-secondary">
          Select 2 to 5 ETFs to compare side by side.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: SLOT_COUNT }).map((_, i) => {
            const value = slots[i];
            const disabled = isMaxReached && !value;
            return (
              <div key={i} className="relative" ref={i === openSearchIndex ? dropdownRef : undefined}>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-accent/40">
                  <input
                    type="text"
                    placeholder={disabled ? "Max 5 reached" : `ETF ${i + 1}`}
                    value={
                      value && (openSearchIndex !== i || searchQuery === "")
                        ? value.ticker
                        : openSearchIndex === i
                          ? searchQuery
                          : ""
                    }
                    onChange={(e) => {
                      if (disabled) return;
                      setOpenSearchIndex(i);
                      setSearchQuery(e.target.value);
                      if (!e.target.value) setSlots((prev) => {
                        const n = [...prev];
                        n[i] = null;
                        return n;
                      });
                    }}
                    onFocus={() => {
                      if (disabled) return;
                      setOpenSearchIndex(i);
                      setSearchQuery("");
                    }}
                    disabled={disabled}
                    className="min-w-0 flex-1 bg-transparent text-sm text-content-primary placeholder-content-secondary outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {value && (
                    <button
                      type="button"
                      onClick={() => setSlot(i, null)}
                      className="shrink-0 text-content-secondary hover:text-negative"
                      aria-label={`Remove ${value.ticker}`}
                    >
                      ×
                    </button>
                  )}
                </div>
                {openSearchIndex === i && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg">
                    {searchLoading ? (
                      <div className="px-3 py-2 text-sm text-content-secondary">
                        Searching...
                      </div>
                    ) : filteredSearchResults.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-content-secondary">
                        {searchQuery.trim() ? "No matching ETFs" : "Type to search"}
                      </div>
                    ) : (
                      filteredSearchResults.map((etf) => (
                        <button
                          key={etf.ticker}
                          type="button"
                          className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-badge-bg focus:bg-badge-bg focus:outline-none"
                          onClick={() =>
                            setSlot(i, { ticker: etf.ticker, name: etf.name })
                          }
                        >
                          <span className="font-bold text-heading">
                            {etf.ticker}
                          </span>
                          <span className="text-xs text-content-primary">
                            {etf.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {basket.length > 0 && basket.length < 2 && (
        <div className="flex flex-col items-center justify-center py-16">
          <svg
            className="mb-3 h-10 w-10 text-content-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-center text-sm" style={{ color: "#6B7A99" }}>
            Select at least 2 ETFs above to start comparing
          </p>
        </div>
      )}

      {loading && confirmedTickersKey && confirmedTickersKey.split(",").length >= 2 && (
        <div className="card p-4 text-sm text-content-secondary">
          Loading comparison...
        </div>
      )}
      {error && confirmedTickersKey && confirmedTickersKey.split(",").length >= 2 && (
        <div className="card border-negative bg-negative/10 p-4 text-sm text-negative">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => fetchComparisonData(confirmedTickersKey.split(","))}
            className="btn-primary mt-3"
          >
            Retry
          </button>
        </div>
      )}

      {data.length >= 2 && (
        <>
          <div className="card p-4">
            <h3 className="mb-3 text-lg font-bold text-heading">
              Performance Comparison (1Y, 3Y, 5Y, Since Inception)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={buildPerformanceChartData(data)}
                  margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                  barCategoryGap="30%"
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: "#6B7A99", fontSize: 13 }}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: "#6B7A99", fontSize: 13 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8EDF5",
                      fontSize: 12
                    }}
                    formatter={(value: unknown, name: string) =>
                      typeof value === "number" ? `${name}: ${value.toFixed(2)}%` : null
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 13 }} formatter={(value) => <span style={{ color: "#333333" }}>{value}</span>} />
                  {data.map((etf, i) => (
                    <Bar
                      key={etf.ticker}
                      dataKey={etf.ticker}
                      name={etf.ticker}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      barSize={18}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card overflow-x-auto p-4">
            <table className="min-w-full text-left">
              <thead className="border-b border-border text-sm font-semibold uppercase text-content-secondary">
                <tr>
                  <th className="py-2 pr-4">Metric</th>
                  {data.map((etf) => (
                    <th key={etf.ticker} className="py-2 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={`/etf/${etf.ticker}`}
                            className="text-base font-bold text-heading hover:text-accent"
                          >
                            {etf.ticker}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeByTicker(etf.ticker)}
                            className="shrink-0 text-content-secondary hover:text-negative"
                            aria-label={`Remove ${etf.ticker}`}
                          >
                            ×
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-content-primary">
                          {etf.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderRow("Provider", data, (e) => e.provider)}
                {renderRow("Asset class", data, (e) => e.asset_class)}
                {renderRow("Currency", data, (e) => e.currency)}
                {renderRow("MER (%)", data, (e) => e.mer.toFixed(2))}
                {renderRow(
                  "Distribution yield (%)",
                  data,
                  (e) => e.distribution_yield.toFixed(2)
                )}
                {renderRow("Risk rating", data, (e) => e.risk_rating)}
                {renderRow("Mgmt. fee (%)", data, (e) =>
                  e.management_fee != null
                    ? e.management_fee.toFixed(2)
                    : "—"
                )}
                {renderRow("AUM (M)", data, (e) =>
                  e.assets_under_management_millions != null
                    ? e.assets_under_management_millions.toFixed(0)
                    : "—"
                )}
                {renderRow("Inception date", data, (e) => e.inception_date || "—")}
                {renderRow(
                  "1Y return (%)",
                  data,
                  (e) =>
                    findPerformance(e, "1Y") ??
                    findPerformance(e, "1y") ??
                    "—"
                )}
                {renderRow(
                  "3Y return (%)",
                  data,
                  (e) =>
                    findPerformance(e, "3Y") ??
                    findPerformance(e, "3y") ??
                    "—"
                )}
                {renderRow(
                  "5Y return (%)",
                  data,
                  (e) =>
                    findPerformance(e, "5Y") ??
                    findPerformance(e, "5y") ??
                    "—"
                )}
                {renderRow(
                  "Since inception (%)",
                  data,
                  (e) =>
                    findPerformance(e, "Since Inception") ??
                    findPerformance(e, "since inception") ??
                    "—"
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="card p-4 text-sm text-content-secondary">
          Loading compare...
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}

function renderRow(
  label: string,
  etfs: ETFDetail[],
  selector: (e: ETFDetail) => string
) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-4 text-sm font-semibold text-content-secondary">{label}</td>
      {etfs.map((etf) => (
        <td key={etf.ticker + label} className="py-2 px-4 text-sm font-normal text-content-primary">
          {selector(etf)}
        </td>
      ))}
    </tr>
  );
}

function findPerformance(etf: ETFDetail, period: string): string | null {
  const p = etf.performance?.find(
    (x) => x.period.toLowerCase() === period.toLowerCase()
  );
  return p ? p.return_pct.toFixed(2) : null;
}

function getPerformanceValue(etf: ETFDetail, period: string): number | null {
  const p = etf.performance?.find(
    (x) => x.period.toLowerCase() === period.toLowerCase()
  );
  return p ? p.return_pct : null;
}

function buildPerformanceChartData(etfs: ETFDetail[]) {
  return PERFORMANCE_PERIODS.filter((period) => {
    const hasData = etfs.some((etf) => getPerformanceValue(etf, period) != null);
    return hasData;
  }).map((period) => {
    const point: Record<string, string | number> = { period };
    etfs.forEach((etf) => {
      const v = getPerformanceValue(etf, period);
      point[etf.ticker] = v ?? 0;
    });
    return point;
  });
}
