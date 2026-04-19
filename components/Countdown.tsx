"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Meeting = {
  id: string;
  title: string;
  endsAt: number;
};

export function Countdown() {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [pct, setPct] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch active meeting
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await fetch("/api/votes/meetings");
        const d = await res.json();
        const now = Date.now();
        const active = (d.meetings || []).find((m: any) => m.endsAt > now) || null;
        setMeeting(active);
      } catch {}
      setLoading(false);
    };
    fetchMeeting();
    // Re-check every 30s in case a new meeting opens
    const id = setInterval(fetchMeeting, 30000);
    return () => clearInterval(id);
  }, []);

  // Tick every second
  useEffect(() => {
    if (!meeting) return;
    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, meeting.endsAt - now);
      const duration = meeting.endsAt - (meeting.endsAt - (meeting.endsAt % (24 * 3600 * 1000)));
      setTimeLeft(left);
      // progress: how far through the meeting we are
      const elapsed = (meeting.endsAt - left) - (meeting.endsAt - 24 * 3600 * 1000);
      setPct(Math.min(100, Math.max(0, (elapsed / (24 * 3600 * 1000)) * 100)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [meeting]);

  function fmt(ms: number) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  if (loading) return null;

  if (!meeting) {
    return (
      <div className="corp-card p-6 flex items-center gap-4">
        <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
        <div className="text-muted text-sm uppercase tracking-widest">No meeting in session — check back soon</div>
      </div>
    );
  }

  return (
    <div className="corp-border p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="label mb-1">// Next Distribution fires in</div>
          <div className="text-4xl font-bold font-mono text-accent">{fmt(timeLeft)}</div>
          <div className="text-xs text-muted mt-1">{meeting.title}</div>
        </div>
        <div className="text-right space-y-2">
          <div className="flex items-center justify-end gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-accent font-bold">Community vote in session</span>
          </div>
          <div>
            <Link href="/meetings" className="btn-primary text-xs">Vote now →</Link>
          </div>
        </div>
      </div>
      <div className="w-full h-1 bg-white/10 rounded mt-4">
        <div className="h-1 bg-accent rounded transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted">
        <span>Meeting opened</span>
        <span>Distribution fires</span>
      </div>
    </div>
  );
}
