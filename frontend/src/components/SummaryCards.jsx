function formatUSD(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)
}

function formatPercent(n) {
  return `${n.toFixed(2)}%`
}

function MetricCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-50">{value}</div>
      {subtext ? <div className="mt-1 text-xs text-slate-500">{subtext}</div> : null}
    </div>
  )
}

export default function SummaryCards({ summary }) {
  const invested = summary?.total_invested ?? 0
  const value = summary?.current_value ?? 0
  const pnl = summary?.profit_loss ?? 0
  const roi = summary?.roi_percent ?? 0

  const pnlIsPositive = pnl >= 0

  return (
    <section className="grid gap-4 md:grid-cols-4">
      <MetricCard label="Total Invested" value={formatUSD(invested)} />
      <MetricCard label="Current Value" value={formatUSD(value)} />
      <MetricCard
        label="P/L"
        value={formatUSD(pnl)}
        subtext={formatPercent(roi)}
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
        <div className="text-sm text-slate-400">Status</div>
        <div className="mt-2 text-2xl font-semibold">
          <span className={pnlIsPositive ? 'text-emerald-400' : 'text-rose-400'}>
            {pnlIsPositive ? 'Up' : 'Down'}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          React is viewing Python-validated data (no duplicate math).
        </div>
      </div>
    </section>
  )
}
