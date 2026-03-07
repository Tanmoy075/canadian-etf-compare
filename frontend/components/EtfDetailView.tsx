import { ETFDetail, PerformancePoint } from "../lib/api";
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

const PERFORMANCE_DISPLAY_ORDER = ["5Y", "10Y", "Since Inception", "3Y", "1Y"];

function orderPerformance(performance: PerformancePoint[]) {
  const byPeriod = new Map(
    performance.map((p) => [p.period.toLowerCase().replace(/\s+/g, " "), p])
  );
  const ordered: PerformancePoint[] = [];
  for (const label of PERFORMANCE_DISPLAY_ORDER) {
    const key = label.toLowerCase();
    const p =
      byPeriod.get(key) ??
      byPeriod.get(label.replace(/\s+/g, " ").toLowerCase());
    if (p) ordered.push(p);
  }
  performance.forEach((p) => {
    const k = p.period.toLowerCase().replace(/\s+/g, " ");
    if (!PERFORMANCE_DISPLAY_ORDER.some((l) => l.toLowerCase() === k))
      ordered.push(p);
  });
  return ordered;
}

export function EtfDetailView({ etf }: { etf: ETFDetail }) {
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-light">
                {etf.ticker}
              </span>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {etf.provider}
              </span>
            </div>
            <h2 className="font-display mt-2 text-lg font-semibold text-content-primary">
              {etf.name}
            </h2>
            <p className="mt-1 text-xs text-content-secondary">
              {etf.asset_class} &middot; {etf.currency} &middot; Risk:{" "}
              {etf.risk_rating}
            </p>
            {etf.tracking_index && (
              <p className="mt-2 text-xs text-content-secondary">
                Tracking index:{" "}
                <span className="text-content-primary">
                  {etf.tracking_index}
                </span>
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-3">
            <Metric label="MER" value={`${etf.mer.toFixed(2)} %`} />
            <Metric
              label="Distribution yield"
              value={`${etf.distribution_yield.toFixed(2)} %`}
            />
            <Metric
              label="Mgmt. fee"
              value={
                etf.management_fee != null
                  ? `${etf.management_fee.toFixed(2)} %`
                  : "—"
              }
            />
            <Metric
              label="AUM"
              value={
                etf.assets_under_management_millions != null
                  ? `$${etf.assets_under_management_millions.toFixed(
                      0
                    )}M`
                  : "—"
              }
            />
            <Metric label="Inception" value={etf.inception_date || "—"} />
          </div>
        </div>
      </div>

      {etf.performance && etf.performance.length > 0 && (
        <div className="card p-4">
          <h3 className="font-display mb-3 text-sm font-medium text-content-primary">
            Performance (5Y, 10Y, Since Inception)
          </h3>
          <p className="mb-3 text-xs text-content-secondary">
            Annualized return by period. Missing periods are omitted if data is not available.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={orderPerformance(etf.performance).map((p) => ({
                  period: p.period,
                  "Return (%)": p.return_pct
                }))}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#0a1628" />
                <XAxis
                  dataKey="period"
                  tick={{ fill: "#6B7A99", fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: "#6B7A99", fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Return"]}
                  contentStyle={{
                    backgroundColor: "#050d1a",
                    border: "1px solid rgba(99,179,237,0.15)",
                    fontSize: 12
                  }}
                />
                <Legend />
                <Bar
                  dataKey="Return (%)"
                  fill="#63B3ED"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {etf.sector_breakdown && etf.sector_breakdown.length > 0 && (
          <BreakdownCard
            title="Sector breakdown"
            items={etf.sector_breakdown}
          />
        )}
        {etf.top_holdings && etf.top_holdings.length > 0 && (
          <BreakdownCard
            title="Top holdings"
            items={etf.top_holdings}
          />
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/80 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-content-secondary">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-content-primary">
        {value}
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  items
}: {
  title: string;
  items: { label: string; weight_pct: number }[];
}) {
  return (
    <div className="card p-4">
      <h3 className="font-display mb-3 text-sm font-medium text-content-primary">
        {title}
      </h3>
      <ul className="space-y-2 text-xs text-content-primary">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between"
          >
            <span>{item.label}</span>
            <span className="text-content-secondary">
              {item.weight_pct.toFixed(1)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

