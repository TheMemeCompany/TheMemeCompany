"use client";
import { useEffect, useState } from "react";

type DistSummary = {
  id: string;
  createdAt: number;
  tokenMint: string;
  tokenSymbol: string;
  totalAmount: string;
  recipients: number;
  claimedCount: number;
};

export function DistributionHistory() {
  const [distributions, setDistributions] = useState<DistSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/distributions/list")
      .then((r) => r.json())
      .then((d) => setDistributions(d.distributions || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="label mb-4">// Distribution History</div>

      {loading && <div className="text-muted text-sm">Loading…</div>}

      {!loading && distributions.length === 0 && (
        <div className="corp-card p-6">
          <div className="text-muted text-sm">First distribution fires 30 minutes after launch.</div>
        </div>
      )}

      {distributions.length > 0 && (
        <div className="space-y-3">
          {distributions.map((d, i) => (
            <div key={d.id} className="corp-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="text-2xl font-bold text-accent font-mono">
                  #{distributions.length - i}
                </div>
                <div>
                  <div className="font-bold text-lg">${d.tokenSymbol}</div>
                  <a
                    href={`https://dexscreener.com/solana/${d.tokenMint}`}
                    target="_blank"
                    className="text-xs font-mono text-muted hover:text-accent"
                  >
                    {d.tokenMint.slice(0, 6)}…{d.tokenMint.slice(-4)}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-8 text-right">
                <div>
                  <div className="label text-[10px]">Sent to</div>
                  <div className="font-bold">{d.recipients} wallets</div>
                </div>
                <div>
                  <div className="label text-[10px]">Date</div>
                  <div className="text-sm">{new Date(d.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="stamp">Sent</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
