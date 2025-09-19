#!/usr/bin/env python3
"""
Crypto Price Tracker
--------------------
Reads an Excel sheet of crypto holdings and enriches it with live prices,
totals, and P/L metrics; outputs an updated Excel and CSV.

Usage:
  python crypto_price_tracker.py --input sample_data/Crypto_Investment_Tracker_template.xlsx --output out/Updated_Crypto_Investment_Tracker.xlsx
  python crypto_price_tracker.py --input your_file.xlsx --csv  # also write CSV
  python crypto_price_tracker.py --input your_file.xlsx --offline  # skip API (for testing)

Excel Required Columns (case-sensitive):
  - Date of Purchase
  - Coin Type
  - Quantity
  - Cost per Coin (USD)

Optional Columns:
  - Notes

Dependencies:
  - pandas
  - requests
  - openpyxl
"""
from __future__ import annotations

import argparse
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional, Tuple

import pandas as pd

API_URL = "https://api.coingecko.com/api/v3/simple/price"

# A small, easily extendable mapping to CoinGecko IDs.
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

REQUIRED_COLS = ["Date of Purchase", "Coin Type", "Quantity", "Cost per Coin (USD)"]

@dataclass
class PriceResult:
    usd: Optional[float]
    error: Optional[str] = None


def get_current_price(coin_id: str, session, max_retries: int = 3, backoff: float = 1.0) -> PriceResult:
    """Fetch current USD price from CoinGecko with simple retries."""
    params = {"ids": coin_id, "vs_currencies": "usd"}
    for attempt in range(1, max_retries + 1):
        try:
            resp = session.get(API_URL, params=params, timeout=10)
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


def validate_schema(df: pd.DataFrame) -> Tuple[bool, Optional[str]]:
    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        return False, f"Missing required columns: {', '.join(missing)}"
    return True, None


def enrich(df: pd.DataFrame, offline: bool = False) -> pd.DataFrame:
    """Add pricing and P/L columns. Assumes schema already validated."""
    out = df.copy()
    out["Coin Key"] = out["Coin Type"].astype(str).str.strip().str.lower()
    out["Current Price (USD)"] = pd.NA
    out["Position Value (USD)"] = pd.NA
    out["Cost Basis (USD)"] = (out["Quantity"] * out["Cost per Coin (USD)"]).round(2)
    out["Unrealized P/L (USD)"] = pd.NA
    out["Unrealized P/L (%)"] = pd.NA

    if offline:
        # Skip API lookups; leave price-related fields as NA
        return out

    import requests
    session = requests.Session()

    for idx, row in out.iterrows():
        key = row["Coin Key"]
        coin_id = COIN_NAME_TO_ID.get(key)
        if not coin_id:
            out.at[idx, "Current Price (USD)"] = pd.NA
            continue

        pr = get_current_price(coin_id, session=session)
        if pr.usd is None:
            out.at[idx, "Current Price (USD)"] = pd.NA
            continue

        price = float(pr.usd)
        qty = float(row["Quantity"])
        cost_basis = float(out.at[idx, "Cost Basis (USD)"])

        position_value = round(price * qty, 2)
        pl_usd = round(position_value - cost_basis, 2)
        pl_pct = round((pl_usd / cost_basis) * 100.0, 2) if cost_basis else pd.NA

        out.at[idx, "Current Price (USD)"] = price
        out.at[idx, "Position Value (USD)"] = position_value
        out.at[idx, "Unrealized P/L (USD)"] = pl_usd
        out.at[idx, "Unrealized P/L (%)"] = pl_pct

        # polite pacing to reduce rate limit risk
        time.sleep(1.0)

    return out.drop(columns=["Coin Key"])


def summarize(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate totals by coin and overall."""
    # Ensure numeric
    for col in ["Quantity", "Cost per Coin (USD)", "Current Price (USD)", "Position Value (USD)", "Cost Basis (USD)", "Unrealized P/L (USD)"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    by_coin = df.groupby("Coin Type", dropna=False).agg(
        Quantity=("Quantity", "sum"),
        Cost_Basis_USD=("Cost Basis (USD)", "sum"),
        Position_Value_USD=("Position Value (USD)", "sum"),
        Unrealized_PL_USD=("Unrealized P/L (USD)", "sum"),
    ).reset_index()

    totals = {
        "Quantity": by_coin["Quantity"].sum(),
        "Cost_Basis_USD": by_coin["Cost_Basis_USD"].sum(),
        "Position_Value_USD": by_coin["Position_Value_USD"].sum(),
        "Unrealized_PL_USD": by_coin["Unrealized_PL_USD"].sum(),
    }
    overall = pd.DataFrame([{"Coin Type": "TOTAL", **totals}])
    return pd.concat([by_coin, overall], ignore_index=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Crypto Price Tracker")
    parser.add_argument("--input", "-i", required=True, help="Path to input Excel file")
    parser.add_argument("--output", "-o", help="Path to output Excel file (default: out/Updated_<inputname>.xlsx)")
    parser.add_argument("--csv", action="store_true", help="Also write a CSV alongside the Excel output")
    parser.add_argument("--offline", action="store_true", help="Skip API calls (useful for testing)")
    args = parser.parse_args(argv)

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"[ERROR] Input file not found: {in_path}")
        sys.exit(1)

    # Read Excel
    try:
        df = pd.read_excel(in_path)
    except Exception as e:
        print(f"[ERROR] Failed to read Excel: {e}")
        sys.exit(1)

    ok, err = validate_schema(df)
    if not ok:
        print(f"[ERROR] {err}")
        sys.exit(1)

    enriched = enrich(df, offline=args.offline)
    summary = summarize(enriched.copy())

    # Prepare output
    out_dir = Path(args.output).parent if args.output else Path("out")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_xlsx = Path(args.output) if args.output else out_dir / f"Updated_{in_path.name}"
    out_csv = out_xlsx.with_suffix(".csv")

    # Write Excel with multiple sheets
    try:
        with pd.ExcelWriter(out_xlsx, engine="openpyxl") as writer:
            enriched.to_excel(writer, index=False, sheet_name="Holdings")
            summary.to_excel(writer, index=False, sheet_name="Summary")
        if args.csv:
            enriched.to_csv(out_csv, index=False)
    except Exception as e:
        print(f"[ERROR] Failed to write outputs: {e}")
        sys.exit(1)

    print(f"[OK] Wrote: {out_xlsx}")
    if args.csv:
        print(f"[OK] Wrote: {out_csv}")


if __name__ == "__main__":
    main()
