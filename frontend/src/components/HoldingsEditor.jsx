import { useMemo, useState } from 'react'

function toNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function upper(v) {
  return (v ?? '').toString().toUpperCase().trim()
}

export default function HoldingsEditor({ holdings, onChange }) {
  const rows = Array.isArray(holdings) ? holdings : []
  const [confirmIndex, setConfirmIndex] = useState(null)

  const canRemove = useMemo(() => rows.length > 0, [rows.length])

  function addRow() {
    const next = [
      ...rows,
      {
        symbol: 'NEW',
        name: 'New Asset',
        amount: 0,
        avg_cost: 0,
        current_price: 0,
        value: 0,
        pnl: 0,
      },
    ]
    onChange(next)
  }

  function updateRow(index, patch) {
    const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r))
    onChange(next)
  }

  function requestRemove(index) {
    setConfirmIndex(index)
  }

  function cancelRemove() {
    setConfirmIndex(null)
  }

  function removeRow(index) {
    const next = rows.filter((_, i) => i !== index)
    onChange(next)
    setConfirmIndex(null)
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 shadow-sm">
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">Edit Holdings</h2>
          <div className="text-xs text-slate-500">
            Local-only edits (saved in your browser). Python remains source of truth for validation.
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800 transition-colors"
          >
            + Add asset
          </button>
          <button
            disabled={!canRemove}
            onClick={() => rows.length && requestRemove(rows.length - 1)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 transition-colors disabled:opacity-40"
            title="Quick remove last row (optional)"
          >
            Remove last
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-t border-slate-800 text-sm">
          <thead className="bg-slate-950">
            <tr className="text-left text-slate-400">
              <th className="px-5 py-3 font-medium">Symbol</th>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Avg Cost</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((h, idx) => (
              <tr
                key={`${h.symbol}-${idx}`}
                className="border-t border-slate-900 text-slate-200 hover:bg-slate-900/40 transition-colors duration-150"
              >
                <td className="px-5 py-3">
                  <input
                    value={h.symbol ?? ''}
                    onChange={(e) => updateRow(idx, { symbol: upper(e.target.value) })}
                    className="w-28 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-600"
                  />
                </td>

                <td className="px-5 py-3">
                  <input
                    value={h.name ?? ''}
                    onChange={(e) => updateRow(idx, { name: e.target.value })}
                    className="w-64 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-600"
                  />
                </td>

                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateRow(idx, { amount: Math.max(0, toNumber(h.amount) - 1) })}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-slate-200 hover:bg-slate-900 transition-colors"
                      title="-1"
                    >
                      –
                    </button>

                    <input
                      value={h.amount ?? 0}
                      onChange={(e) => updateRow(idx, { amount: Math.max(0, toNumber(e.target.value)) })}
                      inputMode="decimal"
                      className="w-28 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-600"
                    />

                    <button
                      onClick={() => updateRow(idx, { amount: toNumber(h.amount) + 1 })}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-slate-200 hover:bg-slate-900 transition-colors"
                      title="+1"
                    >
                      +
                    </button>
                  </div>

                  <div className="mt-1 text-xs text-slate-500">Step size = 1 (we’ll tune this later)</div>
                </td>

                <td className="px-5 py-3">
                  <input
                    value={h.avg_cost ?? 0}
                    onChange={(e) => updateRow(idx, { avg_cost: Math.max(0, toNumber(e.target.value)) })}
                    inputMode="decimal"
                    className="w-32 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-600"
                  />
                  <div className="mt-1 text-xs text-slate-500">Manual (for now)</div>
                </td>

                <td className="px-5 py-3">
                  {confirmIndex === idx ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeRow(idx)}
                        className="rounded-xl border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200 hover:bg-rose-950/70 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={cancelRemove}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => requestRemove(idx)}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {rows.length === 0 ? (
              <tr className="border-t border-slate-900">
                <td className="px-5 py-6 text-slate-500" colSpan={5}>
                  No holdings yet. Click “Add asset”.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
