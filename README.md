# 🚀 Crypto Price Tracker

![CI](https://github.com/cg112358/crypto-price-tracker/actions/workflows/ci.yml/badge.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg?logo=python)
![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-purple.svg?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green.svg)

🌐 **Live Demo:** [Open App](https://cg112358.github.io/crypto-price-tracker/)

<p align="center">
  <img src="docs/images/ui-dashboard.png" width="700">
</p>

<p align="center">
  <em>React dashboard for editing holdings and viewing live portfolio metrics.</em>
</p>

A crypto portfolio tracker built with a **Python data pipeline** and a **React frontend**.

The application reads crypto holdings from an Excel file, fetches live prices from the **CoinGecko API**, and calculates:

- Position value
- Cost basis
- Unrealized profit/loss

Results are exported to Excel and optionally CSV for offline portfolio analysis.

---

## Tech Stack

**Backend**

- Python 3.11
- CoinGecko API
- Pandas
- Excel export (openpyxl)

**Frontend**

- React 19
- Vite 7
- TailwindCSS
- LocalStorage persistence

**DevOps**

- GitHub Actions CI
- GitHub Pages deployment

## Architecture

The project consists of two primary components:

```text
React Frontend (Vite)
        │
        │ Fetch live prices
        ▼
CoinGecko API
        │
        │ Portfolio calculations
        ▼
Python Data Pipeline
        │
        │ Export results
        ▼
Excel / CSV Reports
```

**Python Processing Pipeline**

- Reads holdings data from Excel
- Fetches market prices from CoinGecko
- Calculates portfolio metrics and summaries
- Generates updated Excel reports

**React Frontend**

- Interface for editing crypto holdings
- Displays portfolio summaries and metrics
- Supports live price refresh and portfolio updates

---

## Repository Structure

See [docs/TREE.md](docs/TREE.md) for the current project layout.

## ✨ Features

- Input validation for required columns
- Live prices via CoinGecko (with retries) — or `--offline` mode for testing
- Per-position metrics: **Cost Basis**, **Position Value**, **Unrealized P/L (USD/%)**
- Aggregated summary by coin + Overall totals
- Multiple outputs: Excel (`.xlsx`) and optional CSV
- Friendly CLI and simple configuration
- Fully tested with **pytest**, linted with **ruff**, and formatted with **black**
- React frontend for portfolio visualization and editing

---

## 📦 Requirements / Installation

- Python 3.11
- pandas
- requests
- openpyxl
- XlsxWriter
- pytz

### Virtual environment (Git Bash / macOS / Linux)

```bash
python -m venv .venv
source ./.venv/Scripts/activate
pip install -r requirements.txt
```

### Optional helper script

If you prefer a shortcut, you can activate the virtual environment with:

```bash
source ./activate.sh
```

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

Repository structure is documented in [docs/TREE.md](docs/TREE.md).
Development logs and archived notes live under [docs/logs](docs/logs).

---

## 📜 License

MIT
