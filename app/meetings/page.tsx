"use client";
import { useEffect, useState, useRef } from "react";
import LiveChat from "@/components/LiveChat";

type Meeting = {
  id: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
};

type Tally = Record<number, { weight: number; voters: number }>;

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/votes/meetings")
      .then((r) => r.json())
      .then((d) => setMeetings(d.meetings || []))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const active = meetings.filter((m) => m.endsAt > now);
  const past = meetings.filter((m) => m.endsAt <= now);

  return (
    <div className="space-y-10">
      <header>
        <div className="label mb-2">// COMMUNITY</div>
        <h1 className="text-4xl font-bold font-serif">Community Vote</h1>
      </header>

      {loading && <div className="text-muted">Loading…</div>}

      {!loading && active.length === 0 && (
        <div className="corp-card p-8 text-center space-y-2">
          <div className="text-muted">No vote in session right now.</div>
          <div className="text-xs text-muted">Check back soon — votes open every 24 hours.</div>
        </div>
      )}

      {active.map((m) => (
        <ActiveMeeting key={m.id} meeting={m} />
      ))}

      {past.length > 0 && (
        <section>
          <div className="label mb-4">// Past Votes</div>
          <div className="space-y-3">
            {past.map((m) => <PastMeeting key={m.id} meeting={m} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ActiveMeeting({ meeting }: { meeting: Meeting }) {
  const [tally, setTally] = useState<Tally>({});
  const [walletInput, setWalletInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [voted, setVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(meeting.endsAt - Date.now());

  // Countdown
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(meeting.endsAt - Date.now()), 1000);
    return () => clearInterval(id);
  }, [meeting.endsAt]);

  // Poll tally
  useEffect(() => {
    const fetchTally = () =>
      fetch(`/api/votes/tally?meetingId=${meeting.id}`)
        .then((r) => r.json())
        .then((d) => setTally(d.tally || {}));
    fetchTally();
    const id = setInterval(fetchTally, 5000);
    return () => clearInterval(id);
  }, [meeting.id]);

  const totalWeight = Object.values(tally).reduce((s, v) => s + v.weight, 0);

  const hrs = Math.max(0, Math.floor(timeLeft / 3600000));
  const mins = Math.max(0, Math.floor((timeLeft % 3600000) / 60000));
  const secs = Math.max(0, Math.floor((timeLeft % 60000) / 1000));

  async function vote(idx: number) {
    if (!walletInput.trim()) return setStatus("Paste your $COIN wallet address first");
    setSubmitting(true);
    setStatus("");
    try {
      const res = await fetch("/api/votes/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id, wallet: walletInput.trim(), choice: idx }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Vote failed");
      setStatus(`✓ Vote cast — weight: ${Number(d.weight).toLocaleString()} $COIN`);
      setVoted(true);
      const t = await fetch(`/api/votes/tally?meetingId=${meeting.id}`).then((r) => r.json());
      setTally(t.tally || {});
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Parse ticker|CA format
  function parseOption(raw: string) {
    const [ticker, ca] = raw.split("|");
    return { ticker: ticker.trim(), ca: ca?.trim() || "" };
  }

  // Sort options by votes for display
  const sortedOptions = meeting.options.map((opt, i) => ({
    ...parseOption(opt), i,
    weight: tally[i]?.weight || 0,
    voters: tally[i]?.voters || 0,
    pct: totalWeight > 0 ? ((tally[i]?.weight || 0) / totalWeight) * 100 : 0,
  })).sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-0">
      {/* Meeting header bar */}
      <div className="corp-border border-b-0 px-6 py-4 flex items-center justify-between bg-accent/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-bold text-accent">Vote in session</span>
          <span className="text-xs text-muted uppercase tracking-widest">— {meeting.title}</span>
        </div>
        <div className="font-mono font-bold text-accent text-lg">
          {String(hrs).padStart(2,"0")}:{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 corp-border">

        {/* Left: voting panel */}
        <div className="p-6 border-r border-white/10 space-y-6">

          {/* Top picks */}
          <div>
            <div className="label mb-4">// Top Picks</div>
            <div className="space-y-3">
              {sortedOptions.map(({ ticker, ca, i, weight, voters, pct }, rank) => (
                <div key={i} className={`corp-border p-4 relative ${rank === 0 && weight > 0 ? "border-accent/50" : ""}`}>
                  {rank === 0 && weight > 0 && (
                    <div className="absolute top-2 right-2 text-[10px] uppercase tracking-widest text-accent font-bold">Leading</div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xl font-bold">${ticker}</div>
                      {ca && (
                        <a href={`https://dexscreener.com/solana/${ca}`} target="_blank"
                          className="text-xs font-mono text-muted hover:text-accent">
                          {ca.slice(0, 8)}…{ca.slice(-4)}
                        </a>
                      )}
                      <div className="text-xs text-muted mt-1">{voters} voter{voters !== 1 ? "s" : ""} · {pct.toFixed(1)}%</div>
                    </div>
                    {!voted && (
                      <button
                        onClick={() => vote(i)}
                        disabled={submitting}
                        className="btn-primary px-6"
                      >
                        {submitting ? "…" : "Vote"}
                      </button>
                    )}
                    {voted && <div className="text-xs text-accent font-bold">✓ Voted</div>}
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded">
                    <div
                      className="h-1.5 bg-accent rounded transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wallet input */}
          {!voted && (
            <div>
              <div className="label mb-2">Your $COIN wallet address</div>
              <input
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                placeholder="Paste your Solana wallet address to vote"
                className="w-full bg-white/5 border border-white/15 px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
              />
              <div className="text-xs text-muted mt-1">Balance checked on-chain to weight your vote. Nothing is signed or connected.</div>
            </div>
          )}

          {status && <div className="text-xs text-accent">{status}</div>}

          {/* Vote totals */}
          {totalWeight > 0 && (
            <div className="corp-card p-3 text-xs text-muted">
              Total voting weight: {totalWeight.toLocaleString()} $COIN
              &nbsp;·&nbsp;
              {Object.values(tally).reduce((s, v) => s + v.voters, 0)} voters
            </div>
          )}
        </div>

        {/* Right: chat */}
        <div className="flex flex-col">
          <LiveChat meetingId={meeting.id} fullHeight={false} />
        </div>
      </div>
    </div>
  );
}

function PastMeeting({ meeting }: { meeting: Meeting }) {
  const [tally, setTally] = useState<Tally>({});

  useEffect(() => {
    fetch(`/api/votes/tally?meetingId=${meeting.id}`)
      .then((r) => r.json())
      .then((d) => setTally(d.tally || {}));
  }, [meeting.id]);

  const totalWeight = Object.values(tally).reduce((s, v) => s + v.weight, 0);
  const winnerIdx = Object.entries(tally).sort(([, a], [, b]) => b.weight - a.weight)[0]?.[0];
  const winnerRaw = winnerIdx !== undefined ? meeting.options[Number(winnerIdx)] : null;
  const winner = winnerRaw ? winnerRaw.split("|")[0].trim() : null;

  return (
    <div className="corp-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold">{meeting.title}</div>
          <div className="text-xs text-muted">{new Date(meeting.endsAt).toLocaleDateString()}</div>
        </div>
        <div className="flex items-center gap-3">
          {winner && (
            <div className="text-sm">
              Winner: <span className="text-accent font-bold">${winner}</span>
            </div>
          )}
          <div className="stamp">Closed</div>
        </div>
      </div>
      <div className="flex gap-4 flex-wrap">
        {meeting.options.map((opt, i) => {
          const weight = tally[i]?.weight || 0;
          const pct = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
          return (
            <div key={i} className="text-xs text-muted">
              ${opt} <span className="text-paper">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
