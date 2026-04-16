"use client";
import { useEffect, useState } from "react";

type Suggestion = {
  id: string;
  ticker: string;
  ca: string;
  reason: string;
  submittedBy: string;
  timestamp: number;
  votes: number;
};

export default function ForumPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [ticker, setTicker] = useState("");
  const [ca, setCa] = useState("");
  const [reason, setReason] = useState("");
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState("");
  const [voted, setVoted] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      return new Set(JSON.parse(localStorage.getItem("mc_forum_voted") || "[]"));
    }
    return new Set();
  });

  useEffect(() => {
    fetch("/api/forum").then((r) => r.json()).then((d) => setSuggestions((d.suggestions || []).sort((a: Suggestion, b: Suggestion) => b.votes - a.votes)));
  }, []);

  const voterKey = handle || "anon";

  async function submit() {
    if (!ticker.trim()) return setStatus("Ticker required");
    setStatus("Submitting…");
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, ca, reason, submittedBy: handle || "Anonymous" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setStatus("✓ Submitted");
      setTicker(""); setCa(""); setReason("");
      const updated = await fetch("/api/forum").then((r) => r.json());
      setSuggestions(updated.suggestions || []);
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
  }

  async function upvote(id: string) {
    if (voted.has(id)) return;
    try {
      const res = await fetch("/api/forum/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, voterKey }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      const newVoted = new Set([...voted, id]);
      setVoted(newVoted);
      localStorage.setItem("mc_forum_voted", JSON.stringify([...newVoted]));
      setSuggestions((prev) => [...prev.map((s) => s.id === id ? { ...s, votes: d.votes } : s)].sort((a, b) => b.votes - a.votes));
    } catch {}
  }

  return (
    <div className="space-y-10">
      <header>
        <div className="label mb-2">// LEADERBOARD</div>
        <h1 className="text-4xl font-bold font-serif">Leaderboard</h1>
        <p className="text-muted mt-2 max-w-2xl">
          Submit a coin for the next shareholder meeting. The most voted suggestions get added to the vote by the board.
        </p>
      </header>

      <div className="flex gap-8 items-start">
        {/* Submit form — left column */}
        <div className="corp-card p-6 space-y-3 w-80 shrink-0">
          <div className="label mb-2">Submit a coin</div>
          <div>
            <div className="label text-[10px] mb-1">Ticker</div>
            <input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="$BONK" className="inp w-full" />
          </div>
          <div>
            <div className="label text-[10px] mb-1">Your name (optional)</div>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" className="inp w-full" />
          </div>
          <div>
            <div className="label text-[10px] mb-1">Contract address (optional)</div>
            <input value={ca} onChange={(e) => setCa(e.target.value)} placeholder="Mint address" className="inp w-full font-mono text-xs" />
          </div>
          <div>
            <div className="label text-[10px] mb-1">Why this coin? (optional)</div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Tell us why the company should buy this" className="inp w-full" maxLength={280} />
          </div>
          <button onClick={submit} className="btn-primary w-full">Submit</button>
          {status && <div className="text-xs text-accent">{status}</div>}
          <style jsx>{`.inp{background:rgba(255,255,255,0.04);border:1px solid rgba(245,241,232,0.15);padding:8px 12px;font-family:ui-monospace,monospace;font-size:13px;color:#f5f1e8;}`}</style>
        </div>

        {/* Leaderboard — right column */}
        <section className="flex-1 min-w-0">
          <div className="label mb-4">// Sorted by votes</div>
          {suggestions.length === 0 && (
            <div className="corp-card p-6 text-muted">No suggestions yet. Be the first.</div>
          )}
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={s.id} className="corp-card p-4 flex items-start gap-4">
                <div className="text-2xl font-bold font-mono text-accent w-8 shrink-0">#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-bold">${s.ticker}</span>
                    {s.ca && (
                      <a href={`https://dexscreener.com/solana/${s.ca}`} target="_blank"
                        className="text-xs font-mono text-muted hover:text-accent truncate">
                        {s.ca.slice(0, 8)}…
                      </a>
                    )}
                  </div>
                  {s.reason && <p className="text-sm text-muted">{s.reason}</p>}
                  <div className="text-xs text-muted mt-1">by {s.submittedBy} · {new Date(s.timestamp).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => upvote(s.id)}
                  disabled={voted.has(s.id)}
                  className={`shrink-0 flex flex-col items-center corp-border px-3 py-2 min-w-[52px] transition-colors ${
                    voted.has(s.id) ? "text-accent border-accent" : "hover:border-accent hover:text-accent"
                  }`}
                >
                  <span className="text-lg leading-none">▲</span>
                  <span className="text-sm font-bold">{s.votes}</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
