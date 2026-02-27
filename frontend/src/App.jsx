import { useEffect, useState } from 'react'
import seed from './data/mockPortfolio.json'
import SummaryCards from './components/SummaryCards.jsx'
import HoldingsEditor from './components/HoldingsEditor.jsx'
import HoldingsTable from './components/HoldingsTable.jsx'

const STORAGE_KEY = 'cpt_holdings_v1'

function loadHoldings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed.holdings
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seed.holdings
  } catch {
    return seed.holdings
  }
}

// Recalculate holdings locally (Phase 2A)
function recomputeHoldingsLocal(holdings) {
  const list = Array.isArray(holdings) ? holdings : []

  return list.map((h) => {
    const amount = Number(h?.amount ?? 0)
    const avgCost = Number(h?.avg_cost ?? 0)
    const price = Number(h?.current_price ?? 0)

    const value = amount * price
    const invested = amount * avgCost
    const pnl = value - invested

    return {
      ...h,
      value,
      pnl,
    }
  })
}

function recomputeSummaryLocal(holdings) {
  const list = Array.isArray(holdings) ? holdings : []

  const total_invested = list.reduce(
    (sum, h) => sum + Number(h?.amount ?? 0) * Number(h?.avg_cost ?? 0),
    0
  )
  const current_value = list.reduce((sum, h) => sum + Number(h?.value ?? 0), 0)
  const profit_loss = current_value - total_invested
  const roi_percent = total_invested > 0 ? (profit_loss / total_invested) * 100 : 0

  return { total_invested, current_value, profit_loss, roi_percent }
}

export default function App() {
  const [holdings, setHoldings] = useState(() => recomputeHoldingsLocal(loadHoldings()))
  const [summary, setSummary] = useState(() =>
    recomputeSummaryLocal(recomputeHoldingsLocal(loadHoldings()))
  )

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
    } catch {
      // ignore storage errors
    }
  }, [holdings])

  function resetToSeed() {
    const next = recomputeHoldingsLocal(seed.holdings)
    setHoldings(next)
    setSummary(recomputeSummaryLocal(next))
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  function recalcLocal() {
    const next = recomputeHoldingsLocal(holdings)
    setHoldings(next)
    setSummary(recomputeSummaryLocal(next))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Crypto Portfolio Viewer</h1>
            <p className="mt-1 text-sm text-slate-400">
              Edit holdings locally (Step 2A). Python recomputation comes later (Step 2B).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resetToSeed}
              className="w-fit rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 transition-colors"
              title="Reset holdings back to mock data"
            >
              Reset demo data
            </button>

            <button
              onClick={recalcLocal}
              className="w-fit rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 transition-colors"
              title="Recompute Value and P/L locally (temporary until Python validates)"
            >
              Recalculate (local)
            </button>
          </div>
        </header>

        <SummaryCards summary={summary} />

        <HoldingsEditor holdings={holdings} onChange={setHoldings} />

        <div className="mt-8">
          <div className="mb-2 text-sm text-slate-400">Viewer (search + sort)</div>
          <HoldingsTable holdings={holdings} />
        </div>

        <footer className="mt-10 text-xs text-slate-500">
          Step 2A: edits persist in localStorage. Step 2B will validate/recompute via Python.
        </footer>
      </div>
    </div>
  )
}
