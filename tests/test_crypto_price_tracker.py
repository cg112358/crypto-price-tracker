import pandas as pd
from pathlib import Path
import importlib.util

# Dynamically import the script as a module
MODULE_PATH = Path(__file__).parents[1] / "crypto_price_tracker.py"
spec = importlib.util.spec_from_file_location("crypto_price_tracker", MODULE_PATH)
crypto = importlib.util.module_from_spec(spec)
spec.loader.exec_module(crypto)


def test_validate_schema_passes():
    df = pd.DataFrame({
        "Date of Purchase": ["2025-01-01"],
        "Coin Type": ["BTC"],
        "Quantity": [0.5],
        "Cost per Coin (USD)": [20000.0],
    })
    ok, err = crypto.validate_schema(df)
    assert ok is True
    assert err is None


def test_validate_schema_fails():
    df = pd.DataFrame({
        "Date of Purchase": ["2025-01-01"],
        "Coin Type": ["BTC"],
        "Quantity": [0.5],
        # missing Cost per Coin (USD)
    })
    ok, err = crypto.validate_schema(df)
    assert ok is False
    assert "Missing required columns" in err


def test_enrich_offline_computes_cost_basis_only():
    df = pd.DataFrame({
        "Date of Purchase": ["2025-01-01"],
        "Coin Type": ["BTC"],
        "Quantity": [2.0],
        "Cost per Coin (USD)": [10000.0],
    })
    out = crypto.enrich(df, offline=True)
    # No live price expected
    assert "Current Price (USD)" in out.columns
    assert pd.isna(out.loc[0, "Current Price (USD)"])
    # Cost basis should be present
    assert out.loc[0, "Cost Basis (USD)"] == 20000.0


def test_summarize_rolls_up_totals():
    df = pd.DataFrame({
        "Date of Purchase": ["2025-01-01", "2025-01-02"],
        "Coin Type": ["BTC", "XRP"],
        "Quantity": [1.0, 100.0],
        "Cost per Coin (USD)": [30000.0, 0.5],
    })
    enriched = crypto.enrich(df, offline=True)
    summary = crypto.summarize(enriched.copy())
    # Expect TOTAL row
    total_row = summary[summary["Coin Type"] == "TOTAL"].iloc[0]
    assert total_row["Quantity"] == 101.0
    # Cost basis = 30000 + 50
    assert abs(total_row["Cost_Basis_USD"] - 30050.0) < 1e-6
