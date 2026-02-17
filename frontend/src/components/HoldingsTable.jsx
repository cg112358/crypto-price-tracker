import { useMemo, useState } from 'react'

function formatUSD(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)
}

function formatNumber(n) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
  }).format(n)
}

const SORTS = [
  { key: 'symbol', label: 'Asset (A→Z)' },
  { key: 'value_desc', label: 'Value (High→Low)' },
  { key: 'pnl_desc', label: 'P/L (High→Low)' },
  { key: 'pnl_asc', label: 'P/L (Low→High)' },
]

export default function HoldingsTable({ holdings }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('value_desc')

  const rows = useMemo(() => {
    const base = Array.isArray(holdings) ? holdings : []

    const q = query.trim().toLowerCase()
    const filtered = q
      ? base.filter((h) => {
          const symbol = (h?.symbol ?? '').toLowerCase()
          const name = (h?.name ?? '').toLowerCase()
          return symbol.includes(q) || name.includes(q)
        })
      : base

    const sorted = [...filtered].sort((a, b) => {
      const aSym = (a?.symbol ?? '').toString()
      const bSym = (b?.symbol ?? '').toString()

      const aVal = Number(a?.value ?? 0)
      const bVal = Number(b?.value ?? 0)

      const aPnl = Number(a?.pnl ?? 0)
      const bPnl = Number(b?.pnl ?? 0)

      switch (sortKey) {
        case 'symbol':
          return aSym.localeCompare(bSym)
        case 'value_desc':
          return bVal - aVal
        case 'pnl_desc':
          return bPnl - aPnl
        case 'pnl_asc':
          return aPnl - bPnl
        default:
          return 0
      }
    })

    return sorted
  }, [holdings, query, sortKey])

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 shadow-sm">
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Holdings</h2>
          <div className="text-xs text-slate-500">Viewer mode (Phase 1)</div>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search BTC, Ethereum…"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600 md:w-56"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600 md:w-56"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-t border-slate-800 text-sm">
          <thead className="bg-slate-950 sticky top-0 z-10">
            <tr className="text-left text-slate-400">
              <th className="px-5 py-3 font-medium">Asset</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Avg Cost</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Value</th>
              <th className="px-5 py-3 font-medium">P/L</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((h) => {
              const pnl = Number(h?.pnl ?? 0)
              const pnlIsPositive = pnl >= 0
              return (
                <tr
                  key={h.symbol}
                  className="border-t border-slate-900 text-slate-200 hover:bg-slate-900/40 transition-colors duration-150"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-50">{h.symbol}</div>
                    <div className="text-xs text-slate-500">{h.name}</div>
                  </td>
                  <td className="px-5 py-3">{formatNumber(h.amount ?? 0)}</td>
                  <td className="px-5 py-3">{formatUSD(h.avg_cost ?? 0)}</td>
                  <td className="px-5 py-3">{formatUSD(h.current_price ?? 0)}</td>
                  <td className="px-5 py-3">{formatUSD(h.value ?? 0)}</td>
                  <td className={'px-5 py-3 font-medium ' + (pnlIsPositive ? 'text-emerald-400' : 'text-rose-400')}>
                    {formatUSD(pnl)}
                  </td>
                </tr>
              )
            })}

            {rows.length === 0 ? (
              <tr className="border-t border-slate-900">
                <td className="px-5 py-6 text-slate-500" colSpan={6}>
                  No results. Try clearing the search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
