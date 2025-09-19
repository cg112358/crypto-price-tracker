
# Crypto Price Tracker

![Python CI](https://github.com/cg112358/crypto-price-tracker/actions/workflows/python-tests.yml/badge.svg)
![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

A simple, offline-first crypto holdings tracker that reads an Excel file and enriches it with live prices, position values, and unrealized P/L. Outputs an updated Excel (with **Holdings** and **Summary** sheets) and optionally a CSV.

> This project started from an earlier script and was refactored for reliability, validation, and GitHub readiness.

## Features
- Input validation for required columns
- Live prices via CoinGecko (with retries) — or `--offline` mode for testing
- Per-position metrics: **Cost Basis**, **Position Value**, **Unrealized P/L (USD/%)**
- Summary by coin + Overall totals
- Multiple outputs: Excel (`.xlsx`) and optional CSV
- Friendly CLI and simple configuration

## Requirements
- Python 3.9+
- pandas
- requests
- openpyxl

Install deps:

```bash
pip install -r requirements.txt
```

## Usage

```bash
python crypto_price_tracker.py --input sample_data/Crypto_Investment_Tracker_template.xlsx --output out/Updated_Crypto_Investment_Tracker.xlsx
# also write CSV
python crypto_price_tracker.py --input your_file.xlsx --csv
# test without API calls
python crypto_price_tracker.py --input your_file.xlsx --offline
```

## Excel Schema

**Required columns (case-sensitive):**
- `Date of Purchase`
- `Coin Type`
- `Quantity`
- `Cost per Coin (USD)`

**Optional:**
- `Notes`

You can add extra columns; they will be preserved in the output.

A template is provided at: `sample_data/Crypto_Investment_Tracker_template.xlsx`

## Notes
- Rates are fetched from the free CoinGecko API; add new symbols by extending `COIN_NAME_TO_ID` in the script.
- If you hit API rate limits, rerun with `--offline` to validate flows without fetching prices.
- This tool does **not** store API keys (CoinGecko endpoint used here is public).

## Docker

Build and run with Docker:

```bash
docker build -t crypto-tracker .
docker run --rm -v "$PWD":/app crypto-tracker python crypto_price_tracker.py --input sample_data/Crypto_Investment_Tracker_template.xlsx --output out/Updated_Crypto_Investment_Tracker.xlsx --offline
```

## Testing

Install dev dependencies and run tests:

```bash
pip install -r dev-requirements.txt
pytest -q
# or
make test
```

## CI & Quality

This repo includes a GitHub Actions workflow that runs **ruff**, **black** (check), and **pytest** on every push/PR to `main`.

After you create the GitHub repo, add this badge to the top of the README (already included here):

```
![Python CI](https://github.com/<user>/<repo>/actions/workflows/python-tests.yml/badge.svg)
```

Optional local hooks with **pre-commit**:

```bash
pip install -r dev-requirements.txt
pre-commit install
# then on each commit, black/ruff will run automatically
```

## License
MIT
