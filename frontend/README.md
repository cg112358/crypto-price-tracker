# Crypto Price Tracker — Frontend

This directory contains the **React frontend** for the Crypto Price Tracker project.

The UI allows users to:

- View portfolio summaries
- Edit crypto holdings
- Refresh live market prices
- Track profit/loss performance

The frontend displays portfolio data calculated by the Python processing pipeline.

---

## Tech Stack

- React
- Vite
- TailwindCSS
- ESLint

---

## Project Structure

```text
src/
├── components/   → UI components (tables, cards, editors)
├── data/         → mock portfolio data used during development
├── utils/        → helper utilities for formatting, math, and styling
├── pages/        → application pages
├── App.jsx       → main application logic
└── main.jsx      → application entry point
```

---

## Running the Frontend

From the project root:

```bash
cd frontend
npm install
npm run dev
```

The development server will start at:

`http://localhost:5173`

---

## Key Components


**HoldingsEditor**
- Allows users to modify crypto portfolio positions.

**HoldingsTable**
- Displays holdings, price data, and position values.

**SummaryCards**
- Shows overall portfolio totals and profit/loss metrics.

## Notes

- The frontend currently uses mock portfolio data during development.
- Integration with the backend processing pipeline is planned for future versions.