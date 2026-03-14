"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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
import { ETFDetail, fetchCompare } from "../../lib/api";
import { CompareItem, loadCompare, saveCompare } from "../../lib/compareStore";

const PERFORMANCE_PERIODS = ["1Y", "3Y", "5Y", "Since Inception"];
const CHART_COLORS = ["#63B3ED", "#34D399", "#F87171", "#FBBF24", "#A78BFA"];

function getBasketFromUrl(searchParams: URLSearchParams): CompareItem[] {
  const tickers = searchParams.get("tickers");
  if (!tickers || typeof tickers !== "string") return [];
  const list = tickers.split(",").map((t) => t.trim()).filter(Boolean);
  return list.slice(0, 5).map((ticker) => ({ ticker, name: ticker }));
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const [basket, setBasket] = useState<CompareItem[]>([]);
  const [data, setData] = useState<ETFDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = getBasketFromUrl(searchParams);
    if (fromUrl.length > 0) {
      setBasket(fromUrl);
      saveCompare(fromUrl);
    } else {
      setBasket(loadCompare());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!basket.length) {
      setData([]);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchCompare(basket.map((b) => b.ticker));
        setData(res.items);
      } catch (e) {
        console.error(e);
        setError("Failed to load comparison data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [basket]);

  useEffect(() => {
    saveCompare(basket);
  }, [basket]);

  const removeFromBasket = (ticker: string) => {
    setBasket((prev) => prev.filter((b) => b.ticker !== ticker));
  };

  const clearBasket = () => {
    setBasket([]);
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-content-primary">
              Compare basket
            </h2>
            <p className="mt-1 text-xs text-content-secondary">
              You can compare up to 5 ETFs side by side.
            </p>
          </div>
          <button
            className="btn-secondary text-xs"
            onClick={clearBasket}
            disabled={!basket.length}
          >
            Clear basket
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {basket.map((item) => (
            <span
              key={item.ticker}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-content-primary"
            >
              <span className="text-base font-semibold">{item.ticker}</span>
              <button
                onClick={() => removeFromBasket(item.ticker)}
                className="text-content-secondary hover:text-content-primary"
              >
                ×
              </button>
            </span>
          ))}
          {!basket.length && (
            <span className="text-content-secondary">
              No ETFs selected. Go back to the main page and add some to
              your basket.
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="card p-4 text-sm text-content-secondary">
          Loading comparison...
        </div>
      )}
      {error && (
        <div className="card border-negative/40 bg-negative/10 p-4 text-sm text-negative">
          {error}
        </div>
      )}

      {data.length > 0 && (
        <>
          <div className="card p-4">
            <h3 className="font-display mb-3 text-lg font-bold text-content-primary">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.1)" />
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
                      backgroundColor: "#050d1a",
                      border: "1px solid rgba(99,179,237,0.15)",
                      fontSize: 12
                    }}
                    formatter={(value: unknown, name: string) =>
                      typeof value === "number" ? `${name}: ${value.toFixed(2)}%` : null
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 13 }} formatter={(value) => <span style={{ color: "#E8EDF5" }}>{value}</span>} />
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
            <thead className="border-b border-accent-light/15 text-sm uppercase text-[#A8B8D0]">
              <tr>
                <th className="py-2 pr-4">Metric</th>
                {data.map((etf) => (
                  <th key={etf.ticker} className="py-2 px-4">
                    <div className="flex flex-col">
                      <a
                        href={`/etf/${etf.ticker}`}
                        className="font-display text-base font-semibold text-content-primary hover:text-accent-light"
                      >
                        {etf.ticker}
                      </a>
                        <span className="font-display font-bold text-sm text-[#A8B8D0]">
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
    <tr className="border-b border-accent-light/15 last:border-0">
      <td className="py-2 pr-4 text-sm text-[#A8B8D0]">{label}</td>
      {etfs.map((etf) => (
        <td key={etf.ticker + label} className="py-2 px-4 text-sm text-[#E8EDF5]">
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

