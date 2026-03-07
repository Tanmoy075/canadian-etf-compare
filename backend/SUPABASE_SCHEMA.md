# Expected Supabase table schema

The backend expects these tables and columns:

## `etfs`
| Column | Type | Required |
|--------|------|----------|
| ticker | text | yes (unique) |
| name | text | yes |
| provider | text | yes |
| asset_class | text | yes |
| mer | numeric | yes |
| distribution_yield | numeric | yes |
| risk_rating | text | yes |
| currency | text | yes |
| tracking_index | text | no |
| inception_date | text | no |
| aum_millions | numeric | no |
| management_fee | numeric | no |

## `etf_performance`
| Column | Type | Required |
|--------|------|----------|
| ticker | text | yes (FK to etfs) |
| period | text | yes (e.g. "1Y", "3Y", "5Y", "10Y", "Since Inception") |
| return_pct | numeric | yes |

## `etf_holdings`
| Column | Type | Required |
|--------|------|----------|
| ticker | text | yes (FK to etfs) |
| label | text | yes |
| weight | numeric | yes |
| holding_type | text | yes ("sector" for sector breakdown, "holding" for top holdings) |

## Environment variables
Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` (create `backend/.env` from `.env.example` or configure in your deployment platform).
