#!/usr/bin/env python3
"""
Fetch Canadian ETF list from Stock Analysis and merge into app CSV format.

Usage:
  # Parse a saved markdown/file (e.g. from Cursor web fetch):
  python fetch_stockanalysis_etfs.py --file path/to/saved_page.txt

  # Fetch directly from URL (requires page to return parseable table):
  python fetch_stockanalysis_etfs.py --url

  # Output path (default: backend/data/canadian_etfs_stockanalysis.csv):
  python fetch_stockanalysis_etfs.py --file page.txt -o merged.csv
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Add backend to path so we can use app.repository
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Provider inference from ETF name (order matters: longer matches first)
PROVIDER_PATTERNS = [
    (r"\bVanguard\b", "Vanguard"),
    (r"\biShares\b", "iShares"),
    (r"\bBMO\b", "BMO"),
    (r"\bFidelity\b", "Fidelity"),
    (r"\bGlobal X\b", "Global X"),
    (r"\bMackenzie\b", "Mackenzie"),
    (r"\bPurpose\b", "Purpose"),
    (r"\bScotia\b", "Scotia"),
    (r"\bPIMCO\b", "PIMCO"),
    (r"\bNBI\b", "NBI"),
    (r"\bDesjardins\b", "Desjardins"),
    (r"\bCIBC\b", "CIBC"),
    (r"\bCI\s", "CI"),
    (r"\bHamilton\b", "Hamilton"),
    (r"\bHarvest\b", "Harvest"),
    (r"\bInvesco\b", "Invesco"),
    (r"\bEvolve\b", "Evolve"),
    (r"\bManulife\b", "Manulife"),
    (r"\bRBC\b", "RBC"),
    (r"\bFranklin\b", "Franklin"),
    (r"\bBetaPro\b", "BetaPro"),
    (r"\bWealthsimple\b", "Wealthsimple"),
    (r"\bTD\s", "TD"),
    (r"\bJPMorgan\b", "JPMorgan"),
    (r"\bCapital Group\b", "Capital Group"),
    (r"\bAGF\b", "AGF"),
    (r"\bGuardian\b", "Guardian"),
    (r"\bBrompton\b", "Brompton"),
    (r"\bDynamic\b", "Dynamic"),
    (r"\bPICTON\b", "PICTON"),
    (r"\bEvovest\b", "Evovest"),
    (r"\bNinepoint\b", "Ninepoint"),
]


def infer_provider(name: str) -> str:
    for pattern, provider in PROVIDER_PATTERNS:
        if re.search(pattern, name, re.I):
            return provider
    return "Other"


def infer_asset_class(name: str) -> str:
    n = name.upper()
    if "BOND" in n or "FIXED INCOME" in n or "PREFERRED" in n or "MONEY MARKET" in n or "T-BILL" in n or "CASH" in n or "SAVINGS" in n:
        return "Fixed Income"
    if "PORTFOLIO" in n or "ALL-IN-ONE" in n or "ALL-IN-ONE" in n or "BALANCED" in n or "GROWTH ETF PORTFOLIO" in n or "CONSERVATIVE" in n:
        return "Multi-Asset"
    return "Equity"


def parse_yield_pct(s: str) -> float:
    if not s or s.strip() in ("-", ""):
        return 0.0
    s = s.strip().rstrip("%")
    try:
        return float(s)
    except ValueError:
        return 0.0


# Markdown table line: | 1 | [VFV](https://...) | Vanguard S&P 500 Index ETF | 165.83 | -0.40% | 0.92% |
MARKDOWN_ROW = re.compile(
    r"^\|\s*\d+\s*\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*([^|]+)\|\s*[\d.]+\s*\|\s*[^|]*\s*\|\s*([^|]*)\s*\|",
    re.MULTILINE,
)


def parse_markdown_table(content: str) -> list[dict]:
    rows = []
    for m in MARKDOWN_ROW.finditer(content):
        ticker = m.group(1).strip()
        name = m.group(2).strip()
        div_yield_str = m.group(3).strip()
        # Skip header-like or invalid
        if ticker.upper() == "SYMBOL" or not name:
            continue
        yield_pct = parse_yield_pct(div_yield_str)
        provider = infer_provider(name)
        asset_class = infer_asset_class(name)
        rows.append({
            "ticker": ticker,
            "name": name,
            "provider": provider,
            "asset_class": asset_class,
            "mer": 0.25,
            "distribution_yield": yield_pct,
            "risk_rating": "Medium",
            "currency": "CAD",
        })
    return rows


def build_csv_row(row: dict) -> dict:
    """Full CSV row with all columns the app expects (optional cols empty)."""
    return {
        "ticker": row["ticker"],
        "name": row["name"],
        "provider": row["provider"],
        "asset_class": row["asset_class"],
        "mer": row["mer"],
        "distribution_yield": row["distribution_yield"],
        "risk_rating": row["risk_rating"],
        "currency": row["currency"],
        "tracking_index": "",
        "inception_date": "",
        "aum_millions": "",
        "management_fee": "",
        "perf_1y": "",
        "perf_3y": "",
        "perf_5y": "",
        "perf_since_inception": "",
        "sector_1_label": "",
        "sector_1_weight": "",
        "sector_2_label": "",
        "sector_2_weight": "",
        "sector_3_label": "",
        "sector_3_weight": "",
        "holding_1_label": "",
        "holding_1_weight": "",
        "holding_2_label": "",
        "holding_2_weight": "",
        "holding_3_label": "",
        "holding_3_weight": "",
        "holding_4_label": "",
        "holding_4_weight": "",
        "holding_5_label": "",
        "holding_5_weight": "",
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Fetch Canadian ETFs from Stock Analysis and output CSV")
    ap.add_argument("--file", type=Path, help="Path to saved page (markdown or text with table)")
    ap.add_argument("--url", action="store_true", help="Fetch from stockanalysis.com (may need saved file if JS-rendered)")
    ap.add_argument("-o", "--output", type=Path, default=None, help="Output CSV path (default: data/canadian_etfs_stockanalysis.csv)")
    args = ap.parse_args()

    content: str
    if args.file and args.file.exists():
        content = args.file.read_text(encoding="utf-8", errors="replace")
        print(f"Parsing {args.file} ({len(content)} chars)...", file=sys.stderr)
    elif args.url:
        try:
            import httpx
            url = "https://stockanalysis.com/list/canadian-etfs/"
            with httpx.Client(follow_redirects=True, timeout=30) as client:
                r = client.get(url, headers={"User-Agent": "Mozilla/5.0 (compatible; CanadianETFCompare/1.0)"})
            r.raise_for_status()
            content = r.text
            print(f"Fetched {url} ({len(content)} chars). Parsing...", file=sys.stderr)
        except Exception as e:
            print("Fetch failed (page may be JS-rendered). Save the page to a file and use --file.", file=sys.stderr)
            raise SystemExit(1) from e
    else:
        print("Use --file path/to/page.txt or --url to fetch. Run with --help for usage.", file=sys.stderr)
        raise SystemExit(1)

    rows = parse_markdown_table(content)
    if not rows:
        print("No table rows found. Ensure the file contains the markdown table from stockanalysis.com.", file=sys.stderr)
        raise SystemExit(1)

    out_path = args.output or (BACKEND_DIR / "data" / "canadian_etfs_stockanalysis.csv")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    import csv
    fieldnames = list(build_csv_row(rows[0]).keys())
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(build_csv_row(r))

    print(f"Wrote {len(rows)} ETFs to {out_path}", file=sys.stderr)
    print("To use in the app: upload this CSV via /admin/upload-csv or replace backend/data/canadian_etfs_sample.csv", file=sys.stderr)


if __name__ == "__main__":
    main()
