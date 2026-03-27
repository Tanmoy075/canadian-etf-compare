import type { Metadata } from "next";
import { fetchEtfDetail } from "../../../lib/api";
import EtfDetailClient from "./EtfDetailClient";

function getSinceInceptionReturnPct(performance: { period: string; return_pct: number }[]) {
  const p = performance?.find(
    (x) => x.period.toLowerCase().replace(/\s+/g, " ") === "since inception"
  );
  return p ? p.return_pct : null;
}

function buildEtfDescription(etf: {
  ticker: string;
  name: string;
  mer: number;
  performance: { period: string; return_pct: number }[];
}) {
  const merStr = etf.mer.toFixed(2);
  const si = getSinceInceptionReturnPct(etf.performance ?? []);
  const siPart = si != null ? `, Since Inception ${si.toFixed(2)}%` : "";
  return `Compare ${etf.ticker} performance, MER, holdings and more. ${etf.name} — MER ${merStr}%${siPart}.`;
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
    const description = buildEtfDescription(etf);
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

export default async function EtfDetailPage({
  params,
}: {
  params: { ticker: string };
}) {
  const ticker = params.ticker?.toUpperCase();
  let jsonLd: string | null = null;

  if (ticker) {
    try {
      const etf = await fetchEtfDetail(ticker);
      const description = buildEtfDescription(etf);
      jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FinancialProduct",
        name: etf.name,
        description,
        url: `https://canadianetfcompare.com/etf/${encodeURIComponent(etf.ticker)}`,
        provider: {
          "@type": "Organization",
          name: etf.provider,
        },
      });
    } catch {
      jsonLd = null;
    }
  }

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      ) : null}
      <EtfDetailClient />
    </>
  );
}
