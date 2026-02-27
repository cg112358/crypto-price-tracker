export function formatUSD(n) {
  const num = Number(n ?? 0)
  const abs = Math.abs(num)

  // More precision for tiny prices/costs (alts), normal precision for totals
  const maxDigits =
    abs === 0 ? 2 :
    abs < 0.01 ? 8 :
    abs < 1 ? 6 :
    abs < 100 ? 4 :
    2

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDigits,
  }).format(num)
}
