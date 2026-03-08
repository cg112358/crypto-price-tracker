import { useCallback, useEffect, useState, useRef } from "react";
import seed from "./data/mockPortfolio.json";
import SummaryCards from "./components/SummaryCards.jsx";
import HoldingsEditor from "./components/HoldingsEditor.jsx";
import HoldingsTable from "./components/HoldingsTable.jsx";

const STORAGE_KEY = "cpt_holdings_v1";

// --- Live pricing (CoinGecko) ---
// Minimal curated mapping: ticker -> CoinGecko coin id
// Add more over time as you need them.
const COINGECKO_ID_BY_SYMBOL = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  MATIC: "polygon-pos",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  UNI: "uniswap",
  ATOM: "cosmos",
  XLM: "stellar",
  AAVE: "aave",
  NEAR: "near",
  ICP: "internet-computer",
  FIL: "filecoin",
  ALGO: "algorand",
  XTZ: "tezos",
  SUI: "sui",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
};

// Defensive normalizer
function normSymbol(v) {
  return (v ?? "").toString().trim().toUpperCase();
}

async function fetchPricesFromCoinGecko(ids, { signal } = {}) {
  const uniq = Array.from(new Set((ids ?? []).filter(Boolean)));
  if (uniq.length === 0) return {};

  const url =
    "https://api.coingecko.com/api/v3/simple/price?" +
    new URLSearchParams({
      ids: uniq.join(","),
      vs_currencies: "usd",
      include_last_updated_at: "true",
    }).toString();

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`CoinGecko error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function loadHoldings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed.holdings;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seed.holdings;
  } catch {
    return seed.holdings;
  }
}

// Recalculate holdings locally (Phase 2A)
function recomputeHoldingsLocal(holdings) {
  const list = Array.isArray(holdings) ? holdings : [];

  return list.map((h) => {
    const amount = Number(h?.amount ?? 0);
    const avgCost = Number(h?.avg_cost ?? 0);
    const price = Number(h?.current_price ?? 0);

    const value = amount * price;
    const invested = amount * avgCost;
    const pnl = value - invested;

    return {
      ...h,
      value,
      pnl,
    };
  });
}

function recomputeSummaryLocal(holdings) {
  const list = Array.isArray(holdings) ? holdings : [];

  const total_invested = list.reduce(
    (sum, h) => sum + Number(h?.amount ?? 0) * Number(h?.avg_cost ?? 0),
    0,
  );
  const current_value = list.reduce((sum, h) => sum + Number(h?.value ?? 0), 0);
  const profit_loss = current_value - total_invested;
  const roi_percent =
    total_invested > 0 ? (profit_loss / total_invested) * 100 : 0;

  return { total_invested, current_value, profit_loss, roi_percent };
}

export default function App() {
  const [initialHoldings] = useState(() =>
    recomputeHoldingsLocal(loadHoldings()),
  );

  const [holdings, setHoldings] = useState(initialHoldings);
  const [summary, setSummary] = useState(() =>
    recomputeSummaryLocal(initialHoldings),
  );

  const [priceStatus, setPriceStatus] = useState("idle");
  const [priceError, setPriceError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const holdingsRef = useRef(holdings);
  const refreshInFlightRef = useRef(false);

  const abortRef = useRef(null);

  useEffect(() => {
    holdingsRef.current = holdings;
  }, [holdings]);

  // Persitant holdings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    } catch {
      // ignore storage errors
    }
  }, [holdings]);

  function resetToSeed() {
    const next = recomputeHoldingsLocal(seed.holdings);
    setPriceStatus("idle");
    setPriceError("");
    setLastUpdated(null);

    setHoldings(next);
    setSummary(recomputeSummaryLocal(next));

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  const refreshPrices = useCallback(async ({ reason = "auto" } = {}) => {
    console.debug(`[refreshPrices] triggered by: ${reason}`);

    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    // cancel any previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setPriceStatus("loading");
    setPriceError("");

    try {
      const snapshot = holdingsRef.current;

      const symbols = snapshot.map((h) => normSymbol(h?.symbol));
      const ids = Array.from(
        new Set(symbols.map((s) => COINGECKO_ID_BY_SYMBOL[s]).filter(Boolean)),
      );

      const data = await fetchPricesFromCoinGecko(ids, {
        signal: abortRef.current.signal,
      });

      const nextRaw = snapshot.map((h) => {
        const symbol = normSymbol(h?.symbol);
        const id = COINGECKO_ID_BY_SYMBOL[symbol];
        const usd = id ? Number(data?.[id]?.usd ?? NaN) : NaN;

        if (!Number.isFinite(usd)) return h;

        return { ...h, current_price: usd };
      });

      const next = recomputeHoldingsLocal(nextRaw);

      setHoldings(next);
      setSummary(recomputeSummaryLocal(next));

      const updatedAts = ids
        .map((id) => Number(data?.[id]?.last_updated_at ?? 0))
        .filter((n) => Number.isFinite(n) && n > 0);

      setLastUpdated(
        updatedAts.length
          ? new Date(Math.max(...updatedAts) * 1000)
          : new Date(),
      );

      // ...rest unchanged...
      setPriceStatus("ok");
    } catch (err) {
      if (err?.name === "AbortError") return; // ignore aborted refreshes
      setPriceStatus("error");
      setPriceError(err?.message || "Failed to fetch (blocked/rate limit).");
    } finally {
      refreshInFlightRef.current = false;
      abortRef.current = null;
    }
  }, []);

  // Auto refresh prices
  useEffect(() => {
    let timer;

    async function autoLoop() {
      await refreshPrices({ reason: "auto" });

      const jitter = Math.floor(Math.random() * 2000); // prevent machine-like polling
      timer = setTimeout(autoLoop, 90000 + jitter);
    }

    autoLoop();

    return () => clearTimeout(timer);
  }, [refreshPrices]);

  function recalcLocal() {
    const next = recomputeHoldingsLocal(holdings);
    setHoldings(next);
    setSummary(recomputeSummaryLocal(next));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">
              Crypto Portfolio Tracker
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Track holdings with live CoinGecko pricing and in-browser
              portfolio updates.
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
            <button
              onClick={() => refreshPrices({ reason: "manual" })}
              disabled={priceStatus === "loading"}
              className="w-fit rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="Fetch live USD prices from CoinGecko and recompute"
            >
              {priceStatus === "loading"
                ? "Refreshing…"
                : "Refresh prices (CoinGecko)"}
            </button>
          </div>
        </header>
        <div className="text-xs text-slate-500">
          {priceStatus === "error" ? (
            <span className="text-red-300">
              Price update failed: {priceError}
            </span>
          ) : lastUpdated ? (
            <span>Last updated: {lastUpdated.toLocaleString()}</span>
          ) : (
            <span>Prices: not updated yet</span>
          )}
        </div>

        <SummaryCards summary={summary} />

        <HoldingsEditor holdings={holdings} onChange={setHoldings} />

        <div className="mt-8">
          <div className="mb-2 text-sm text-slate-400">
            Viewer (search + sort)
          </div>
          <HoldingsTable holdings={holdings} />
        </div>

        <footer className="mt-10 text-xs text-slate-500">
          Step 2A: edits persist in localStorage. Step 2B will
          validate/recompute via Python.
        </footer>
      </div>
    </div>
  );
}
