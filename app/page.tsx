import { TokenDashboard } from "@/components/TokenDashboard";
import { Countdown } from "@/components/Countdown";
import { DistributionHistory } from "@/components/DistributionHistory";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">

      {/* Hero */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left — prospectus */}
        <div className="corp-border p-8 relative">
          <div className="absolute top-4 right-4 stamp">Est. 2026</div>
          <div className="label mb-4">// PROSPECTUS</div>
          <h1 className="text-5xl font-bold font-serif leading-tight mb-6">
            Welcome to<br />
            <span className="text-accent">The Meme Company.</span>
          </h1>
          <div className="space-y-4 leading-relaxed text-sm mb-8">
            <p>
              Become a shareholder at The Meme Company by holding <strong>$MEME</strong>. Every 24 hours, 100% of the pump.fun trading fees will be used to purchase another coin, decided in our daily shareholder meetings.
            </p>
            <p>
              The purchased token supply is distributed across the top 100 holders of $MEME, relative to their holding amount.
            </p>
            <p>
              10% of the developer supply has been allocated to 10 of our favorite Solana KOLs, 1% each. The other 10% is reserved for new KOLs interested in joining the company.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/meetings" className="btn-primary">Vote Now</Link>
            <Link href="/employees" className="btn">Meet the Employees</Link>
          </div>
        </div>

        {/* Right — purpose */}
        <div className="corp-border p-8 flex flex-col justify-between">
          <div>
            <div className="label mb-4">// OUR PURPOSE</div>
            <h2 className="text-3xl font-bold font-serif mb-6">
              There has never been a better use for pump.fun trading fees.<br />
              <span className="text-accent">Until now.</span>
            </h2>
            <div className="space-y-5 text-sm leading-relaxed">
              <div className="corp-card p-4">
                <div className="text-accent font-bold mb-1">A coin you love is dying?</div>
                <p className="text-muted">The Meme Company steps in, buys supply, and distributes it across the biggest KOLs and bag holders in existence.</p>
              </div>
              <div className="corp-card p-4">
                <div className="text-accent font-bold mb-1">Your coin isn't getting enough attention?</div>
                <p className="text-muted">The Meme Company.</p>
              </div>
              <div className="corp-card p-4">
                <div className="text-accent font-bold mb-1">Your coin is sending and you want it to send harder?</div>
                <p className="text-muted">The Meme Company.</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-lg font-bold">The perfect win win.</div>
          </div>
        </div>

      </section>

      <Countdown />

      <TokenDashboard />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HowItWorksCard step="01" title="Hold $MEME" body="Trading fees from every buy and sell accumulate in the company treasury." />
        <HowItWorksCard step="02" title="Vote every 24 hours" body="Token holders vote on which coin the company buys next. Minimum 0.05% supply to vote." />
        <HowItWorksCard step="03" title="Receive automatically" body="The winning coin is purchased and sent directly to the top 100 holders. Nothing to do." />
      </section>

      <DistributionHistory />
    </div>
  );
}

function HowItWorksCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="corp-card p-6">
      <div className="text-accent text-sm font-bold tracking-widest mb-2">{step}</div>
      <div className="text-lg font-bold mb-2">{title}</div>
      <div className="text-sm text-muted leading-relaxed">{body}</div>
    </div>
  );
}
