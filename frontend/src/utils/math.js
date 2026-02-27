export function roundTo(n, decimals = 8) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}