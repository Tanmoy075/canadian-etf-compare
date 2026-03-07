import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://canadian-etf-compare.onrender.com";

export interface ETF {
  ticker: string;
  name: string;
  provider: string;
  asset_class: string;
  mer: number;
  distribution_yield: number;
  risk_rating: string;
  currency: string;
}

export interface PerformancePoint {
  period: string;
  return_pct: number;
}

export interface HoldingsBreakdownItem {
  label: string;
  weight_pct: number;
}

export interface ETFDetail extends ETF {
  tracking_index?: string | null;
  inception_date?: string | null;
  assets_under_management_millions?: number | null;
  management_fee?: number | null;
  performance: PerformancePoint[];
  sector_breakdown: HoldingsBreakdownItem[];
  top_holdings: HoldingsBreakdownItem[];
}

export interface ETFListResponse {
  items: ETF[];
  total: number;
}

const client = axios.create({
  baseURL
});

export async function fetchEtfs(params: {
  q?: string;
  provider?: string;
  asset_class?: string;
  risk_rating?: string;
  min_mer?: number;
  max_mer?: number;
  min_yield?: number;
  max_yield?: number;
  limit?: number;
  offset?: number;
}): Promise<ETFListResponse> {
  const res = await client.get<ETFListResponse>("/etfs", { params });
  return res.data;
}

export async function fetchEtfDetail(
  ticker: string
): Promise<ETFDetail> {
  const res = await client.get<ETFDetail>(`/etfs/${ticker}`);
  return res.data;
}

export async function fetchCompare(
  tickers: string[]
): Promise<{ items: ETFDetail[] }> {
  const params = new URLSearchParams();
  tickers.forEach((t) => params.append("tickers", t));
  const res = await client.get<{ items: ETFDetail[] }>(
    `/etfs/compare?${params.toString()}`
  );
  return res.data;
}

