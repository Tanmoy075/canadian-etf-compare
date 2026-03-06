from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import pandas as pd

from .models import ETF, ETFDetail, ETFListResponse, ETFCompareResponse, PerformancePoint, HoldingsBreakdownItem


DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "canadian_etfs_sample.csv"


@dataclass
class ETFRepository:
    """
    Simple repository backed by a CSV file.

    This is intentionally lightweight so it can later be swapped out for:
    - Database-backed storage
    - Public API integrations
    - Periodically refreshed CSV exports
    """

    _df: pd.DataFrame | None = None

    def replace_dataframe(self, df: pd.DataFrame) -> None:
        self._df = df

    def _load(self) -> pd.DataFrame:
        if self._df is None:
            if not DATA_PATH.exists():
                raise RuntimeError(f"ETF data file not found at {DATA_PATH}")
            self._df = pd.read_csv(DATA_PATH)
        return self._df

    def load_csv_bytes(self, content: bytes) -> None:
        df = pd.read_csv(pd.io.common.BytesIO(content))
        self._validate_schema(df)
        self.replace_dataframe(df)

    def _opt_float(self, row, key: str) -> Optional[float]:
        if key not in row:
            return None
        v = row[key]
        if pd.isna(v) or v == "" or (isinstance(v, str) and v.strip() == ""):
            return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    def _opt_str(self, row, key: str) -> Optional[str]:
        if key not in row:
            return None
        v = row[key]
        if pd.isna(v) or v == "" or (isinstance(v, str) and v.strip() == ""):
            return None
        return str(v).strip() or None

    def _validate_schema(self, df: pd.DataFrame) -> None:
        required = {
            "ticker",
            "name",
            "provider",
            "asset_class",
            "mer",
            "distribution_yield",
            "risk_rating",
            "currency",
        }
        missing = [c for c in sorted(required) if c not in df.columns]
        if missing:
            raise ValueError(f"CSV missing required columns: {', '.join(missing)}")

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
        df = self._load()
        filtered = df

        if q:
            q_lower = q.lower()
            filtered = filtered[
                filtered["ticker"].str.lower().str.contains(q_lower)
                | filtered["name"].str.lower().str.contains(q_lower)
            ]

        if provider:
            filtered = filtered[filtered["provider"].str.lower() == provider.lower()]

        if asset_class:
            filtered = filtered[filtered["asset_class"].str.lower() == asset_class.lower()]

        if risk_rating:
            filtered = filtered[filtered["risk_rating"].str.lower() == risk_rating.lower()]

        if min_mer is not None:
            filtered = filtered[filtered["mer"] >= min_mer]
        if max_mer is not None:
            filtered = filtered[filtered["mer"] <= max_mer]

        if min_yield is not None:
            filtered = filtered[filtered["distribution_yield"] >= min_yield]
        if max_yield is not None:
            filtered = filtered[filtered["distribution_yield"] <= max_yield]

        total = int(filtered.shape[0])
        paged = filtered.sort_values(by=["mer", "ticker"]).iloc[offset : offset + limit]

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
            for _, row in paged.iterrows()
        ]

        return ETFListResponse(items=items, total=total)

    def _build_detail(self, row) -> ETFDetail:
        # Performance columns: perf_1y, perf_3y, perf_5y, perf_10y, perf_since_inception
        perf_points: List[PerformancePoint] = []
        mapping = {
            "1Y": "perf_1y",
            "3Y": "perf_3y",
            "5Y": "perf_5y",
            "10Y": "perf_10y",
            "Since Inception": "perf_since_inception",
        }
        for label, col in mapping.items():
            val = self._opt_float(row, col)
            if val is not None:
                perf_points.append(PerformancePoint(period=label, return_pct=val))

        # Simple breakdowns using generic columns; can be replaced by API-driven data.
        sector_breakdown: List[HoldingsBreakdownItem] = []
        for i in range(1, 6):
            label_col = f"sector_{i}_label"
            weight_col = f"sector_{i}_weight"
            label_val = self._opt_str(row, label_col)
            weight_val = self._opt_float(row, weight_col)
            if label_val is not None and weight_val is not None:
                sector_breakdown.append(HoldingsBreakdownItem(label=label_val, weight_pct=weight_val))

        top_holdings: List[HoldingsBreakdownItem] = []
        for i in range(1, 6):
            label_col = f"holding_{i}_label"
            weight_col = f"holding_{i}_weight"
            label_val = self._opt_str(row, label_col)
            weight_val = self._opt_float(row, weight_col)
            if label_val is not None and weight_val is not None:
                top_holdings.append(HoldingsBreakdownItem(label=label_val, weight_pct=weight_val))

        return ETFDetail(
            ticker=row["ticker"],
            name=row["name"],
            provider=row["provider"],
            asset_class=row["asset_class"],
            mer=float(row["mer"]),
            distribution_yield=float(row["distribution_yield"]),
            risk_rating=row["risk_rating"],
            currency=row["currency"],
            tracking_index=self._opt_str(row, "tracking_index"),
            inception_date=self._opt_str(row, "inception_date"),
            assets_under_management_millions=self._opt_float(row, "aum_millions"),
            management_fee=self._opt_float(row, "management_fee"),
            performance=perf_points,
            sector_breakdown=sector_breakdown,
            top_holdings=top_holdings,
        )

    def get_etf(self, ticker: str) -> Optional[ETFDetail]:
        df = self._load()
        subset = df[df["ticker"].str.upper() == ticker.upper()]
        if subset.empty:
            return None
        row = subset.iloc[0]
        return self._build_detail(row)

    def compare_etfs(self, tickers: List[str]) -> ETFCompareResponse:
        df = self._load()
        tickers_upper = [t.upper() for t in tickers]
        subset = df[df["ticker"].str.upper().isin(tickers_upper)]
        items = [self._build_detail(row) for _, row in subset.iterrows()]
        return ETFCompareResponse(items=items)

