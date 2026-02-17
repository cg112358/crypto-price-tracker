import { useEffect, useMemo, useState } from 'react'
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

export default function App() {
  const [holdings, setHoldings] = useState(() => loadHoldings())

  // Phase 2: summary becomes validated output. For now, keep it static mock.
  const summary = useMemo(() => seed.summary, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
    } catch {
      // ignore storage errors
    }
  }, [holdings])

  function resetToSeed() {
    setHoldings(seed.holdings)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
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

          <button
            onClick={resetToSeed}
            className="w-fit rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 transition-colors"
            title="Reset holdings back to mock data"
          >
            Reset demo data
          </button>
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
