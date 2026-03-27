import type { Metadata } from "next";
import { fetchEtfDetail } from "../../../lib/api";
import EtfDetailClient from "./EtfDetailClient";

function getSinceInceptionReturnPct(performance: { period: string; return_pct: number }[]) {
  const p = performance?.find(
    (x) => x.period.toLowerCase().replace(/\s+/g, " ") === "since inception"
  );
  return p ? p.return_pct : null;
}

export async function generateMetadata({
  params,
}: {
  params: { ticker: string };
}): Promise<Metadata> {
  const raw = params.ticker;
  if (!raw) {
    return {
      title: "ETF | Canadian ETF Compare",
      description:
        "Compare Canadian and US ETFs side by side. Free tool for Canadian investors.",
    };
  }
  const ticker = raw.toUpperCase();
  try {
    const etf = await fetchEtfDetail(ticker);
    const merStr = etf.mer.toFixed(2);
    const si = getSinceInceptionReturnPct(etf.performance ?? []);
    const siPart =
      si != null ? `, Since Inception ${si.toFixed(2)}%` : "";
    const description = `Compare ${etf.ticker} performance, MER, holdings and more. ${etf.name} — MER ${merStr}%${siPart}.`;
    return {
      title: `${etf.ticker} — ${etf.name} | Canadian ETF Compare`,
      description,
    };
  } catch {
    return {
      title: `${ticker} | Canadian ETF Compare`,
      description:
        "Compare Canadian and US ETFs side by side. Free tool for Canadian investors.",
    };
  }
}

export default function EtfDetailPage() {
  return <EtfDetailClient />;
}
