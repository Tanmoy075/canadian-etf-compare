from __future__ import annotations

from typing import List, Optional

from .models import (
    ETF,
    ETFDetail,
    ETFListResponse,
    ETFCompareResponse,
    PerformancePoint,
    HoldingsBreakdownItem,
)
from .supabase_client import get_supabase


class ETFRepository:
    """
    Repository backed by Supabase.
    Tables: etfs, etf_performance, etf_holdings
    """

    def list_etfs(
        self,
        q: Optional[str],
        provider: Optional[str],
        asset_class: Optional[str],
        risk_rating: Optional[str],
        min_mer: Optional[float],
        max_mer: Optional[float],
        min_yield: Optional[float],
        max_yield: Optional[float],
        limit: int,
        offset: int,
    ) -> ETFListResponse:
        client = get_supabase()
        query = client.table("etfs").select("ticker,name,provider,asset_class,mer,distribution_yield,risk_rating,currency", count="exact")

        if q:
            query = query.or_(f"ticker.ilike.%{q}%,name.ilike.%{q}%")
        if provider:
            query = query.eq("provider", provider)
        if asset_class:
            query = query.eq("asset_class", asset_class)
        if risk_rating:
            query = query.eq("risk_rating", risk_rating)
        if min_mer is not None:
            query = query.gte("mer", min_mer)
        if max_mer is not None:
            query = query.lte("mer", max_mer)
        if min_yield is not None:
            query = query.gte("distribution_yield", min_yield)
        if max_yield is not None:
            query = query.lte("distribution_yield", max_yield)

        query = query.order("mer").order("ticker")
        result = query.range(offset, offset + limit - 1).execute()

        items = [
            ETF(
                ticker=row["ticker"],
                name=row["name"],
                provider=row["provider"],
                asset_class=row["asset_class"],
                mer=float(row["mer"]),
                distribution_yield=float(row["distribution_yield"]),
                risk_rating=row["risk_rating"],
                currency=row["currency"],
            )
            for row in (result.data or [])
        ]
        total = result.count if result.count is not None else len(items)
        return ETFListResponse(items=items, total=total)

    def get_etf(self, ticker: str) -> Optional[ETFDetail]:
        client = get_supabase()
        result = (
            client.table("etfs")
            .select("*")
            .eq("ticker", ticker.upper())
            .limit(1)
            .execute()
        )
        if not result.data or len(result.data) == 0:
            return None
        row = result.data[0]
        return self._build_detail(row)

    def _build_detail(self, row: dict) -> ETFDetail:
        ticker = row["ticker"]
        client = get_supabase()

        # Fetch performance
        perf_result = (
            client.table("etf_performance")
            .select("period,return_pct")
            .eq("ticker", ticker)
            .execute()
        )
        perf_points = [
            PerformancePoint(period=p["period"], return_pct=float(p["return_pct"]))
            for p in (perf_result.data or [])
        ]

        # Fetch holdings - columns: label, weight, holding_type ('sector' or 'holding')
        holdings_result = (
            client.table("etf_holdings")
            .select("label,weight,holding_type")
            .eq("ticker", ticker)
            .execute()
        )
        sector_breakdown: List[HoldingsBreakdownItem] = []
        top_holdings: List[HoldingsBreakdownItem] = []
        for h in holdings_result.data or []:
            item = HoldingsBreakdownItem(label=h["label"], weight_pct=float(h["weight"]))
            if h.get("holding_type", "").lower() == "holding":
                top_holdings.append(item)
            else:
                sector_breakdown.append(item)

        return ETFDetail(
            ticker=row["ticker"],
            name=row["name"],
            provider=row["provider"],
            asset_class=row["asset_class"],
            mer=float(row["mer"]),
            distribution_yield=float(row["distribution_yield"]),
            risk_rating=row["risk_rating"],
            currency=row["currency"],
            tracking_index=_opt_str(row, "tracking_index"),
            inception_date=_opt_str(row, "inception_date"),
            assets_under_management_millions=_opt_float(row, "aum_millions") or _opt_float(row, "assets_under_management_millions"),
            management_fee=_opt_float(row, "management_fee"),
            performance=perf_points,
            sector_breakdown=sector_breakdown,
            top_holdings=top_holdings,
        )

    def compare_etfs(self, tickers: List[str]) -> ETFCompareResponse:
        items: List[ETFDetail] = []
        for t in tickers:
            etf = self.get_etf(t)
            if etf:
                items.append(etf)
        return ETFCompareResponse(items=items)


def _opt_float(row: dict, key: str) -> Optional[float]:
    if key not in row or row[key] is None:
        return None
    try:
        return float(row[key])
    except (TypeError, ValueError):
        return None


def _opt_str(row: dict, key: str) -> Optional[str]:
    if key not in row or row[key] is None:
        return None
    s = str(row[key]).strip()
    return s if s else None
