"use client";
import { useEffect, useState } from "react";

type KOL = {
  wallet: string;
  handle: string;
  title: string;
  allocation: number;
  hiredAt: number;
  status: "active" | "fired";
};

export default function KOLsPage() {
  const [kols, setKols] = useState<KOL[]>([]);

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then((d) => setKols(d.employees || []));
  }, []);

  const active = kols.filter((e) => e.status === "active");
  const totalAllocated = active.reduce((s, e) => s + e.allocation, 0);

  return (
    <div className="space-y-10">
      <header>
        <div className="label mb-2">// THE CHOSEN ONES</div>
        <h1 className="text-4xl font-bold font-serif">KOLs</h1>
        <p className="text-muted mt-2 max-w-2xl">
          The most trusted voices in Solana crypto. Ten KOLs each hold 1% of supply. Another 10%
          is reserved for new KOLs — we're always looking for the right people.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric label="Active KOLs" value={active.length.toString()} />
        <Metric label="Supply Allocated" value={`${totalAllocated.toFixed(1)}%`} />
        <Metric label="Open Allocation" value={`${Math.max(0, 20 - totalAllocated).toFixed(1)}% remaining`} />
      </div>

      <section>
        <div className="label mb-4">Roster</div>
        {active.length === 0 && <div className="corp-card p-6 text-muted">KOLs being onboarded. Check back.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.map((e) => (
            <div key={e.wallet} className="corp-card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs text-muted uppercase tracking-widest">{e.title}</div>
                  <a href={`https://x.com/${e.handle.replace("@", "")}`} target="_blank" className="text-lg font-bold hover:text-accent">
                    {e.handle}
                  </a>
                </div>
                <div className="stamp">{e.allocation}%</div>
              </div>
              <a
                href={`https://solscan.io/account/${e.wallet}`}
                target="_blank"
                className="text-xs font-mono text-muted hover:text-accent"
              >
                {e.wallet.slice(0, 8)}…{e.wallet.slice(-6)}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="corp-card p-6">
        <div className="label mb-2">// JOIN</div>
        <div className="text-lg font-bold mb-2">Want to be a KOL?</div>
        <p className="text-sm text-muted max-w-xl">
          10% of supply is reserved for the right KOLs. If you have a track record and want
          a bag plus a spot on the roster, reach out on X.
        </p>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="corp-card p-4">
      <div className="label mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
