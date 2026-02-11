#!/usr/bin/env python3
# pyright: reportArgumentType=false

"""
Crypto Price Tracker
--------------------
Reads an Excel sheet of crypto purchases, normalizes headers, enriches with live
prices, computes holdings & portfolio P/L, writes Excel (and optional CSV), and
can optionally load normalized transactions into Postgres.

Usage examples:
  python crypto_price_tracker.py -i sample_data/Crypto_Investment_Tracker_template.xlsx
  python crypto_price_tracker.py -i sample_data/Crypto_Investment_Tracker_template.xlsx --csv
  python crypto_price_tracker.py -i your_file.xlsx --offline
  python crypto_price_tracker.py -i your_file.xlsx --to-postgres \
    --db-url postgresql+psycopg2://crypto_user:StrongPassword123!@localhost:5432/crypto_tracker
"""

from __future__ import annotations

import argparse
import datetime
import re
import requests
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional, Tuple

import numpy as np  # type: ignore[import-not-found]
import pandas as pd  # type: ignore[import-not-found]

# Optional Postgres imports happen only if --to-postgres is used (imported lazily)

# -----------------------------
# Constants / simple lookups
# -----------------------------
API_URL = "https://api.coingecko.com/api/v3/simple/price"

COIN_NAME_TO_ID: Dict[str, str] = {
    "bitcoin": "bitcoin",
    "btc": "bitcoin",
    "ethereum": "ethereum",
    "eth": "ethereum",
    "cardano": "cardano",
    "ada": "cardano",
    "solana": "solana",
    "sol": "solana",
    "dogecoin": "dogecoin",
    "doge": "dogecoin",
    "hedera": "hedera-hashgraph",
    "hbar": "hedera-hashgraph",
    "ripple": "ripple",
    "xrp": "ripple",
    "stellar": "stellar",
    "xlm": "stellar",
}

REQUIRED_COLS_DISPLAY = [
    "Date of Purchase",
    "Coin Type",
    "Quantity",
    "Cost per Coin (USD)",
]


# --------------------------------
# Helpers: price fetch + dataclass
# --------------------------------
@dataclass
class PriceResult:
    usd: Optional[float]
    error: Optional[str] = None


def get_current_price(
    coin_id: str, session, max_retries: int = 3, backoff: float = 1.0
) -> PriceResult:
    """Fetch current USD price from CoinGecko with simple retries."""
    params = {"ids": coin_id, "vs_currencies": "usd"}

    for attempt in range(1, max_retries + 1):
        try:
            resp = session.get(API_URL, params=params, timeout=10)

            # Special case: rate limit
            if resp.status_code == 429:
                wait = max(5.0, backoff * attempt * 5.0)  # e.g., 5s, 10s, 15s...
                if attempt == max_retries:
                    return PriceResult(usd=None, error=f"Rate limited (429). Waited {wait:.0f}s.")
                print(f"[WARN] Rate limited (429). Sleeping {wait:.0f}s then retrying...")
                time.sleep(wait)
                continue

            resp.raise_for_status()

            data = resp.json()
            if coin_id in data and "usd" in data[coin_id]:
                return PriceResult(usd=float(data[coin_id]["usd"]))

            return PriceResult(usd=None, error="Malformed response")

        except Exception as e:
            if attempt == max_retries:
                return PriceResult(usd=None, error=str(e))
            time.sleep(backoff * attempt)

    return PriceResult(usd=None, error="Unknown error")


# --------------------------------
# Header normalization utilities
# --------------------------------
def _norm(s: str) -> str:
    s = str(s)
    s = re.sub(r"[\u200b\u200c\u200d]", "", s)  # remove zero-width chars
    s = re.sub(r"[_\-]+", " ", s)  # underscores/dashes -> space
    s = re.sub(r"\s+", " ", s).strip().lower()  # collapse spaces & lowercase
    return s


def normalize_headers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Accepts a DataFrame with arbitrary purchase headers and returns a DataFrame
    with **canonical display headers** used by the rest of the pipeline.
    """
    # Step 1: normalize labels for matching
    df = df.copy()
    df.columns = [_norm(c) for c in df.columns]

    # Step 2: map known aliases -> canonical (lowercase working keys)
    alias = {
        "date of purchase": {"date", "purchase date", "date purchased"},
        "coin type": {"coin", "asset", "symbol", "ticker"},
        "quantity": {"qty", "amount", "units"},
        "cost per coin (usd)": {
            "cost per coin",
            "price",
            "unit price",
            "ppercoin",
            "price usd",
            "costpercoinusd",
        },
        "feesusd": {"fees", "fee", "fee usd", "fees (usd)"},
        "exchange": {"exchange", "platform", "broker"},
        "txid": {"txid", "tx id", "transaction id", "hash"},
        "notes": {"notes", "memo", "comment"},
        "totalcostusd": {"total cost usd", "total cost"},
    }

    present = set(df.columns)
    rename_map = {}
    for canon, alts in alias.items():
        if canon in present:
            continue
        for alt in alts:
            if alt in present:
                rename_map[alt] = canon
                break
    if rename_map:
        df = df.rename(columns=rename_map)

    # Step 3: ensure required columns exist
    required_working = [
        "date of purchase",
        "coin type",
        "quantity",
        "cost per coin (usd)",
        "feesusd",
        "exchange",
        "txid",
        "notes",
    ]
    for col in required_working:
        if col not in df.columns:
            df[col] = np.nan

    # Step 4: numeric coercion and compute totalcostusd if needed
    for c in ("quantity", "cost per coin (usd)", "feesusd"):
        df[c] = pd.to_numeric(df[c], errors="coerce")
    if "totalcostusd" not in df.columns:
        df["totalcostusd"] = df["quantity"] * df["cost per coin (usd)"] + df["feesusd"]

    # Step 5: rename to **display** headers expected everywhere else
    df = df.rename(
        columns={
            "date of purchase": "Date of Purchase",
            "coin type": "Coin Type",
            "quantity": "Quantity",
            "cost per coin (usd)": "Cost per Coin (USD)",
            "feesusd": "FeesUSD",
            "exchange": "Exchange",
            "txid": "TxID",
            "notes": "Notes",
            "totalcostusd": "TotalCostUSD",
        }
    )
    return df


def validate_schema(df: pd.DataFrame) -> Tuple[bool, Optional[str]]:
    missing = [c for c in REQUIRED_COLS_DISPLAY if c not in df.columns]
    if missing:
        return False, f"Missing required columns: {', '.join(missing)}"
    return True, None


# --------------------------------
# Enrich & summarize
# --------------------------------
def enrich(df: pd.DataFrame, offline: bool = False) -> pd.DataFrame:
    """Add pricing and P/L columns. Assumes schema already validated (display headers)."""
    out = df.copy()
    out["Coin Key"] = out["Coin Type"].astype(str).str.strip().str.lower()

    # initialize columns
    out["Current Price (USD)"] = pd.NA
    out["Position Value (USD)"] = pd.NA

    fees = pd.to_numeric(out["FeesUSD"], errors="coerce").fillna(0)
    out["Cost Basis (USD)"] = (out["Quantity"] * out["Cost per Coin (USD)"] + fees).round(2)

    out["Unrealized P/L (USD)"] = pd.NA
    out["Unrealized P/L (%)"] = pd.NA

    if offline:
        return out.drop(columns=["Coin Key"])

    import requests

    session = requests.Session()
    price_cache: Dict[str, PriceResult] = {}

    for idx, row in out.iterrows():
        key = str(row["Coin Key"])
        coin_id = COIN_NAME_TO_ID.get(key)
        if not coin_id:
            print(f"[WARN] Unsupported coin symbol/name in sheet: {row['Coin Type']}")
            continue

        pr = price_cache.get(coin_id)
        if pr is None:
            print(f"[INFO] Fetching live price for {coin_id}")
            pr = get_current_price(coin_id, session=session)
            if pr.usd is not None:
                price_cache[coin_id] = pr
                time.sleep(1.0)

        if pr.usd is None:
            print(
                f"[WARN] Live price unavailable for {row['Coin Type']} "
                f"(id={coin_id}): {pr.error}"
            )
            continue

        price = float(pr.usd)
        qty = float(row["Quantity"])

        cb = pd.to_numeric(out.at[idx, "Cost Basis (USD)"], errors="coerce")
        if pd.isna(cb) or cb == 0:
            out.at[idx, "Unrealized P/L (%)"] = pd.NA
            continue
        cost_basis = float(cb)

        position_value = round(price * qty, 2)
        pl_usd = round(position_value - cost_basis, 2)
        pl_pct = round((pl_usd / cost_basis) * 100.0, 2) if cost_basis else pd.NA

        out.at[idx, "Current Price (USD)"] = price
        out.at[idx, "Position Value (USD)"] = position_value
        out.at[idx, "Unrealized P/L (USD)"] = pl_usd
        out.at[idx, "Unrealized P/L (%)"] = pl_pct

    return out.drop(columns=["Coin Key"])


def summarize(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate totals by coin and add a TOTAL row."""
    df = df.copy()
    numeric_cols = [
        "Quantity",
        "Cost per Coin (USD)",
        "Current Price (USD)",
        "Position Value (USD)",
        "Cost Basis (USD)",
        "Unrealized P/L (USD)",
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    by_coin = (
        df.groupby("Coin Type", dropna=False)
        .agg(
            Quantity=("Quantity", "sum"),
            Cost_Basis_USD=("Cost Basis (USD)", "sum"),
            Position_Value_USD=("Position Value (USD)", "sum"),
            Unrealized_PL_USD=("Unrealized P/L (USD)", "sum"),
        )
        .reset_index()
    )

    totals = {
        "Quantity": by_coin["Quantity"].sum(),
        "Cost_Basis_USD": by_coin["Cost_Basis_USD"].sum(),
        "Position_Value_USD": by_coin["Position_Value_USD"].sum(),
        "Unrealized_PL_USD": by_coin["Unrealized_PL_USD"].sum(),
    }
    overall = pd.DataFrame([{"Coin Type": "TOTAL", **totals}])

    return pd.concat([by_coin, overall], ignore_index=True)


# --------------------------------
# Optional: Postgres loader
# --------------------------------
def load_transactions_to_postgres(
    df_transactions: pd.DataFrame,
    db_url: str,
    schema: str = "app",
    table: str = "transactions",
    truncate_first: bool = True,
) -> int:
    """
    Loads df_transactions into schema.table on Postgres.
    Expects columns (lowercase working names): date_of_purchase, coin_type, quantity,
      cost_per_coin_usd, feesusd, exchange, txid, notes, totalcostusd
    Returns rowcount after load.
    """
    from sqlalchemy import create_engine, text  # lazy import

    engine = create_engine(db_url, future=True)
    with engine.begin() as cx:
        if truncate_first:
            cx.execute(text(f"TRUNCATE {schema}.{table};"))
        df_transactions.to_sql(table, cx, schema=schema, if_exists="append", index=False)
        res = cx.execute(text(f"SELECT COUNT(*) FROM {schema}.{table};")).scalar_one()
    return int(res)


# --------------------------------
# Main
# --------------------------------
def main(argv=None):
    parser = argparse.ArgumentParser(description="Crypto Price Tracker")
    parser.add_argument("--input", "-i", required=True, help="Path to input Excel file")
    parser.add_argument("--output", "-o", help="Optional explicit output Excel path")
    parser.add_argument(
        "--csv", action="store_true", help="Also write a CSV alongside the Excel output"
    )
    parser.add_argument("--offline", action="store_true", help="Skip price API calls")
    parser.add_argument(
        "--to-postgres", action="store_true", help="Load normalized rows to Postgres"
    )
    parser.add_argument(
        "--db-url",
        default="postgresql+psycopg2://crypto_user:StrongPassword123!@localhost:5432/crypto_tracker",
        help="SQLAlchemy DB URL for Postgres (used with --to-postgres)",
    )
    args = parser.parse_args(argv)

    in_path = Path(args.input).resolve()
    if not in_path.exists():
        sys.exit(f"[ERROR] Input file not found: {in_path}")

    # 1) Read Excel (prefer 'Transactions' sheet if present)
    try:
        try:
            df_raw = pd.read_excel(in_path, sheet_name="Transactions")
        except ValueError:
            df_raw = pd.read_excel(in_path)  # first worksheet fallback
    except Exception as e:
        sys.exit(f"[ERROR] Failed to read Excel: {e}")

    # 2) Normalize headers to canonical display names
    df = normalize_headers(df_raw)

    # 3) Validate schema
    ok, err = validate_schema(df)
    if not ok:
        sys.exit(f"[ERROR] {err}")

    # 4) Enrich & summarize
    enriched = enrich(df, offline=args.offline)
    summary = summarize(enriched.copy())

    # 5) Prepare outputs
    out_dir = Path("out")
    out_dir.mkdir(parents=True, exist_ok=True)

    today_str = datetime.date.today().strftime("%Y%m%d")
    latest_xlsx = out_dir / "Updated_Crypto_Investment_Tracker.xlsx"
    dated_xlsx = out_dir / f"Updated_Crypto_Investment_Tracker_{today_str}.xlsx"
    explicit_xlsx: Optional[Path] = None
    explicit_dir: Optional[Path] = None

    if args.output:
        p = Path(args.output)
        # If it has no suffix or is an existing dir, treat it as a directory target
        if p.suffix.lower() != ".xlsx" or p.is_dir():
            explicit_dir = p
            explicit_xlsx = explicit_dir / "Updated_Crypto_Investment_Tracker.xlsx"
        else:
            explicit_xlsx = p

    # 6) Write Excel (and optional CSV)
    def _write_all(
        path: Path, df_txn: pd.DataFrame, df_hold: pd.DataFrame, df_summary: pd.DataFrame
    ) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with pd.ExcelWriter(path, engine="openpyxl") as writer:
            df_txn.to_excel(writer, index=False, sheet_name="Transactions")
            df_hold.to_excel(writer, index=False, sheet_name="Holdings")
            df_summary.to_excel(writer, index=False, sheet_name="Summary")

    try:
        # Always write the standard outputs
        for p in (latest_xlsx, dated_xlsx):
            _write_all(p, df, enriched, summary)

        # If user supplied --output, write there too
        if explicit_xlsx:
            _write_all(explicit_xlsx, df, enriched, summary)

        # CSV logic: mirror beside --output if provided; else beside latest
        if args.csv:
            csv_target = (explicit_xlsx or latest_xlsx).with_suffix(".csv")
            csv_target.parent.mkdir(parents=True, exist_ok=True)
            enriched.to_csv(csv_target, index=False)
    except Exception as e:
        sys.exit(f"[ERROR] Failed to write outputs: {e}")

    print(f"[OK] Wrote: {latest_xlsx}")
    print(f"[OK] Wrote: {dated_xlsx}")
    if explicit_xlsx:
        print(f"[OK] Wrote: {explicit_xlsx}")
    if args.csv:
        print(f"[OK] Wrote CSV: {(explicit_xlsx or latest_xlsx).with_suffix('.csv')}")

    # 7) Optional Postgres load (use normalized working column names)
    if args.to_postgres:
        # Convert display headers -> working names that match DB schema
        w = df.rename(
            columns={
                "Date of Purchase": "date_of_purchase",
                "Coin Type": "coin_type",
                "Quantity": "quantity",
                "Cost per Coin (USD)": "cost_per_coin_usd",
                "FeesUSD": "feesusd",
                "Exchange": "exchange",
                "TxID": "txid",
                "Notes": "notes",
                "TotalCostUSD": "totalcostusd",
            }
        )[
            [
                "date_of_purchase",
                "coin_type",
                "quantity",
                "cost_per_coin_usd",
                "feesusd",
                "exchange",
                "txid",
                "notes",
                "totalcostusd",
            ]
        ]

        try:
            final_count = load_transactions_to_postgres(
                w, db_url=args.db_url, schema="app", table="transactions", truncate_first=True
            )
            print(f"[OK] Postgres load complete. app.transactions rowcount: {final_count}")
        except Exception as e:
            sys.exit(f"[ERROR] Postgres load failed: {e}")


if __name__ == "__main__":
    main()
