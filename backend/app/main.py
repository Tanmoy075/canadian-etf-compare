import os

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from .models import ETFDetail, ETFListResponse, ETFCompareResponse
from .repository import ETFRepository


app = FastAPI(title="Canadian ETF Compare API", version="0.1.0")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]

if not allowed_origins:
    allowed_origins = [
        "https://canadianetfcompare.com",
        "https://www.canadianetfcompare.com",
        "https://canadian-etf-compare.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

repo = ETFRepository()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/etfs", response_model=ETFListResponse)
def list_etfs(
    q: Optional[str] = Query(default=None, description="Free-text search on name or ticker"),
    provider: Optional[str] = None,
    asset_class: Optional[str] = None,
    risk_rating: Optional[str] = None,
    min_mer: Optional[float] = None,
    max_mer: Optional[float] = None,
    min_yield: Optional[float] = None,
    max_yield: Optional[float] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> ETFListResponse:
    return repo.list_etfs(
        q=q,
        provider=provider,
        asset_class=asset_class,
        risk_rating=risk_rating,
        min_mer=min_mer,
        max_mer=max_mer,
        min_yield=min_yield,
        max_yield=max_yield,
        limit=limit,
        offset=offset,
    )


@app.get("/etfs/compare", response_model=ETFCompareResponse)
def compare_etfs(tickers: List[str] = Query(..., description="Tickers to compare")) -> ETFCompareResponse:
    if not tickers:
        raise HTTPException(status_code=400, detail="At least one ticker is required")
    return repo.compare_etfs([t.upper() for t in tickers])


@app.get("/etfs/{ticker}", response_model=ETFDetail)
def get_etf(ticker: str) -> ETFDetail:
    etf = repo.get_etf(ticker.upper())
    if not etf:
        raise HTTPException(status_code=404, detail="ETF not found")
    return etf


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

