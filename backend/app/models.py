from typing import List, Optional
from pydantic import BaseModel


class ETF(BaseModel):
    ticker: str
    name: str
    provider: str
    asset_class: str
    mer: float
    distribution_yield: float
    risk_rating: str
    currency: str


class PerformancePoint(BaseModel):
    period: str  # e.g. "1Y", "3Y", "5Y", "Since Inception"
    return_pct: float


class HoldingsBreakdownItem(BaseModel):
    label: str  # e.g. sector or top holding
    weight_pct: float


class ETFDetail(ETF):
    tracking_index: Optional[str] = None
    inception_date: Optional[str] = None
    assets_under_management_millions: Optional[float] = None
    management_fee: Optional[float] = None
    performance: List[PerformancePoint] = []
    sector_breakdown: List[HoldingsBreakdownItem] = []
    top_holdings: List[HoldingsBreakdownItem] = []


class ETFListResponse(BaseModel):
    items: List[ETF]
    total: int


class ETFCompareResponse(BaseModel):
    items: List[ETFDetail]

