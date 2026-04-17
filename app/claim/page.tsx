"use client";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";

type DistSummary = {
  id: string;
  createdAt: number;
  tokenMint: string;
  tokenSymbol: string;
  totalAmount: string;
  recipients: number;
};

export default function DistributionsPage() {
  const [distributions, setDistributions] = useState<DistSummary[]>([]);

  useEffect(() => {
    fetch("/api/distributions/list").then((r) => r.json()).then((d) => setDistributions(d.distributions || []));
  }, []);

  const latest = distributions[0] || null;
  const past = distributions.slice(1);

  return (
    <div className="space-y-10">
      <header>
        <div className="label mb-2">// DISTRIBUTIONS</div>
        <h1 className="text-4xl font-bold font-serif">Distributions</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard step="01" title="Hold $MEME" body="The more you hold, the higher your rank. Top 100 at snapshot time receive the distribution." />
        <InfoCard step="02" title="Vote in meetings" body="Holders with 0.05%+ supply vote on which coin gets bought. The winning coin is what gets distributed." />
        <InfoCard step="03" title="Receive automatically" body="Tokens land directly in your wallet. No action needed." />
      </div>

      {/* Treasury wallet */}
      {process.env.NEXT_PUBLIC_TREASURY_WALLET && (
        <div className="corp-card p-4 flex items-center justify-between">
          <div className="label">// Treasury Wallet</div>
          <a
            href={`https://solscan.io/account/${process.env.NEXT_PUBLIC_TREASURY_WALLET}`}
            target="_blank"
            className="font-mono text-xs text-muted hover:text-accent"
          >
            {process.env.NEXT_PUBLIC_TREASURY_WALLET}
          </a>
        </div>
      )}

      {/* Meeting countdown */}
      <Countdown />
      <div className="text-center text-sm text-muted -mt-6">Distribution begins at the end of the shareholder meeting</div>

      {/* Latest winner — hero section */}
      <section>
        <div className="label mb-4">// Latest Distribution</div>
        {!latest ? (
          <div className="corp-card p-8 text-muted">No distributions yet — first one fires after the current meeting ends.</div>
        ) : (
          <div className="corp-border p-8 flex items-center justify-between gap-8">
            <div>
              <div className="label mb-2">This round's winner</div>
              <div className="text-7xl font-bold font-serif text-accent mb-3">${latest.tokenSymbol}</div>
              <a
                href={`https://dexscreener.com/solana/${latest.tokenMint}`}
                target="_blank"
                className="font-mono text-sm text-muted hover:text-accent"
              >
                {latest.tokenMint}
              </a>
            </div>
            <div className="text-right space-y-4 shrink-0">
              <div>
                <div className="label text-[10px]">Sent to</div>
                <div className="text-3xl font-bold">{latest.recipients}</div>
                <div className="text-muted text-sm">wallets</div>
              </div>
              <div>
                <div className="label text-[10px]">Date</div>
                <div className="font-bold">{new Date(latest.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="stamp">Sent</div>
            </div>
          </div>
        )}
      </section>

      {/* Past distributions */}
      {past.length > 0 && (
        <section>
          <div className="label mb-4">// Previous Distributions</div>
          <div className="space-y-2">
            {past.map((d, i) => (
              <div key={d.id} className="corp-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold text-accent font-mono">#{distributions.length - 1 - i}</div>
                  <div>
                    <div className="font-bold">${d.tokenSymbol}</div>
                    <a href={`https://dexscreener.com/solana/${d.tokenMint}`} target="_blank"
                      className="text-xs font-mono text-muted hover:text-accent">
                      {d.tokenMint.slice(0, 8)}…{d.tokenMint.slice(-4)}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right text-sm">
                  <div>
                    <div className="label text-[10px]">Wallets</div>
                    <div className="font-bold">{d.recipients}</div>
                  </div>
                  <div>
                    <div className="label text-[10px]">Date</div>
                    <div>{new Date(d.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="stamp text-[10px]">Sent</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="corp-card p-6">
      <div className="text-accent text-sm font-bold tracking-widest mb-2">{step}</div>
      <div className="text-lg font-bold mb-2">{title}</div>
      <div className="text-sm text-muted leading-relaxed">{body}</div>
    </div>
  );
}
