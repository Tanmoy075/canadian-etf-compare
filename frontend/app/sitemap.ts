import type { MetadataRoute } from "next";
import { fetchEtfs } from "../lib/api";

const SITE_URL = "https://canadianetfcompare.com";

async function getAllEtfTickers(): Promise<string[]> {
  const limit = 200;
  let offset = 0;
  const tickers: string[] = [];

  while (true) {
    const { items, total } = await fetchEtfs({ limit, offset });
    tickers.push(...items.map((etf) => etf.ticker));
    offset += items.length;

    if (items.length === 0 || offset >= total) {
      break;
    }
  }

  return tickers;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const tickers = await getAllEtfTickers();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...tickers.map((ticker) => ({
      url: `${SITE_URL}/etf/${encodeURIComponent(ticker.toUpperCase())}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
