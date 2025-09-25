# 🚀 Crypto Price Tracker

![CI](https://github.com/cg112358/crypto-price-tracker/actions/workflows/ci.yml/badge.svg?branch=main)
![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)  
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

See the full [Git Cheatsheet](docs/git-cheatsheet.md) for workflow diagram, color legend, and common commands.
---

A Python-based, offline-first crypto holdings tracker that integrates **data processing, API calls, and Excel automation**.  
It reads your holdings from an Excel file, fetches live prices via the **CoinGecko API**, and outputs an updated file with  
calculated **position values, cost basis, and unrealized profit/loss**. Results are saved to Excel (with **Holdings** and **Summary** sheets)  
and optionally as CSV.

> Originally a simple script, this project was refactored for reliability, validation, and GitHub readiness with CI/CD checks.

---

## ✨ Features
- Input validation for required columns
- Live prices via CoinGecko (with retries) — or `--offline` mode for testing
- Per-position metrics: **Cost Basis**, **Position Value**, **Unrealized P/L (USD/%)**
- Aggregated summary by coin + Overall totals
- Multiple outputs: Excel (`.xlsx`) and optional CSV
- Friendly CLI and simple configuration
- Fully tested with **pytest**, linted with **ruff**, and formatted with **black**

---

## 📦 Requirements / Installation
- Python 3.9+
- pandas
- requests
- openpyxl
- XlsxWriter
- pytz

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## ⚡ Usage

Run the tracker from the command line with an input Excel file of your holdings:

```bash
# Basic usage: read input Excel and write updated portfolio
python crypto_price_tracker.py --input sample_data/Crypto_Investment_Tracker_template.xlsx --output out/Updated_Crypto_Investment_Tracker.xlsx

# Also save a CSV alongside the Excel output
python crypto_price_tracker.py --input your_file.xlsx --csv

# Run in offline mode (no API calls, useful for testing)
python crypto_price_tracker.py --input your_file.xlsx --offline
```

---

## 🎬 Demo (with screenshot)

Here’s an example of running the tracker in **offline mode** with the provided template:

```bash
python crypto_price_tracker.py --input sample_data/Crypto_Investment_Tracker_template.xlsx --output out/Updated_Crypto_Investment_Tracker.xlsx --offline
```

> 📌 Screenshot of the Summary sheet to be added here.

---

## 📊 Excel Schema

> Placeholder: add schema details (expected columns, datatypes, and examples).

---

## 📝 Notes

> Placeholder: usage notes, edge cases, or future improvements.

---

## 🐳 Docker

> Placeholder: Dockerfile and container instructions.

---

## 🧪 Testing

Install dev dependencies and run tests:

```bash
pip install -r dev-requirements.txt
pytest -q
# or
make test
```

---

## ⚙️ CI & Quality

This repo includes a GitHub Actions workflow that runs **ruff**, **black** (check), and **pytest** on every push/PR to `main`.

Optional local hooks with **pre-commit**:

```bash
pip install -r dev-requirements.txt
pre-commit install
# then on each commit, black/ruff will run automatically
```

---

## 🤝 Contributor Notes

This project uses Git for version control.  
For full workflow diagram, color legend, and command reference, see the [Git Cheatsheet](docs/git-cheatsheet.md).

---

## 📜 License

MIT
