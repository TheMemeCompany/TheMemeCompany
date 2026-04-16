"use client";
import { useEffect, useState } from "react";

type TokenData = {
  priceUsd?: string;
  marketCap?: number;
  liquidity?: { usd: number };
  volume?: { h24: number };
  fdv?: number;
  pairAddress?: string;
};

export function TokenDashboard() {
  const mint = process.env.NEXT_PUBLIC_TOKEN_MINT;
  const treasury = process.env.NEXT_PUBLIC_TREASURY_WALLET;
  const [data, setData] = useState<TokenData | null>(null);
  const [treasuryBalance, setTreasuryBalance] = useState<number | null>(null);
  const [holderCount, setHolderCount] = useState<number | null>(null);

  useEffect(() => {
    if (!mint) return;
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`)
      .then((r) => r.json())
      .then((d) => {
        const pair = d?.pairs?.[0];
        if (pair) setData(pair);
      })
      .catch(() => {});

    fetch(`/api/holders?mint=${mint}&count=1000`)
      .then((r) => r.json())
      .then((d) => setHolderCount(d?.totalHolders ?? null))
      .catch(() => {});

    if (treasury) {
      fetch(`/api/treasury?wallet=${treasury}`)
        .then((r) => r.json())
        .then((d) => setTreasuryBalance(d?.solBalance ?? null))
        .catch(() => {});
    }
  }, [mint, treasury]);

  if (!mint) {
    return (
      <div className="corp-card p-6">
        <div className="label mb-2">// CA</div>
        <div className="text-accent">Awaiting launch.</div>
      </div>
    );
  }

  return (
    <section>
      <div className="label mb-4">// QUARTERLY REPORT</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Price" value={data?.priceUsd ? `$${Number(data.priceUsd).toPrecision(4)}` : "—"} />
        <Stat label="Market Cap" value={data?.marketCap ? fmtUsd(data.marketCap) : "—"} />
        <Stat label="24h Volume" value={data?.volume?.h24 ? fmtUsd(data.volume.h24) : "—"} />
        <Stat label="Liquidity" value={data?.liquidity?.usd ? fmtUsd(data.liquidity.usd) : "—"} />
        <Stat label="Holders" value={holderCount?.toLocaleString() ?? "—"} />
        <Stat label="Treasury (SOL)" value={treasuryBalance !== null ? treasuryBalance.toFixed(2) : "—"} />
        <Stat label="Contract" value={shorten(mint)} copy={mint} />
        <Stat label="Treasury Wallet" value={treasury ? shorten(treasury) : "—"} copy={treasury} />
      </div>
      {data?.pairAddress && (
        <a
          href={`https://dexscreener.com/solana/${data.pairAddress}`}
          target="_blank"
          className="inline-block mt-4 text-xs text-accent uppercase tracking-widest hover:underline"
        >
          → View chart on DexScreener
        </a>
      )}
    </section>
  );
}

function Stat({ label, value, copy }: { label: string; value: string; copy?: string }) {
  return (
    <div className="corp-card p-4">
      <div className="label text-[10px] mb-1">{label}</div>
      <div
        className={`font-mono ${copy ? "cursor-pointer hover:text-accent" : ""}`}
        onClick={() => copy && navigator.clipboard.writeText(copy)}
        title={copy ? "Click to copy" : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
function shorten(s: string) {
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}
