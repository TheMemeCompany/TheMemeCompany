"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);
  const [tab, setTab] = useState<"meeting" | "distribute" | "employees" | "clear">("meeting");

  async function login() {
    if (!password) return;
    setChecking(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Invalid password");
      setAuthed(true);
    } catch {
      setAuthError("Invalid password");
    } finally {
      setChecking(false);
    }
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20 corp-card p-8 space-y-4">
        <div className="label mb-2">// BOARD ROOM</div>
        <div className="text-lg font-bold">Admin Access</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="w-full bg-white/5 border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-accent"
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
        {authError && <div className="text-xs text-red-400">{authError}</div>}
        <button onClick={login} disabled={checking} className="btn-primary w-full">
          {checking ? "Checking…" : "Enter"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <div className="label mb-2">// BOARD ROOM</div>
        <h1 className="text-4xl font-bold font-serif">Admin</h1>
      </header>
      <div className="flex gap-2 mb-8 border-b border-white/10">
        {(["meeting", "distribute", "employees", "clear"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs uppercase tracking-widest ${tab === t ? "text-accent border-b-2 border-accent" : "text-muted"}`}>
            {t === "meeting" ? "Open Meeting" : t === "distribute" ? "Distribute Fees" : t === "employees" ? "Employees" : "Clear Data"}
          </button>
        ))}
      </div>
      {tab === "meeting" && <CreateMeeting password={password} />}
      {tab === "distribute" && <CreateDistribution password={password} />}
      {tab === "employees" && <ManageEmployees password={password} />}
      {tab === "clear" && <ClearData password={password} />}
    </div>
  );
}

function CreateMeeting({ password }: { password: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState([{ ticker: "", ca: "" }, { ticker: "", ca: "" }]);
  const [hours, setHours] = useState(24);
  const [status, setStatus] = useState("");

  function updateOption(i: number, field: "ticker" | "ca", val: string) {
    setOptions(options.map((o, j) => j === i ? { ...o, [field]: val } : o));
  }

  async function submit() {
    try {
      const cleaned = options
        .filter((o) => o.ticker.trim())
        .map((o) => o.ca.trim() ? `${o.ticker.trim()}|${o.ca.trim()}` : o.ticker.trim());
      if (cleaned.length < 2) return setStatus("Need at least 2 options");
      const res = await fetch("/api/votes/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, options: cleaned, durationHours: hours, adminPassword: password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setStatus(`✓ Meeting opened. Closes in ${hours}h.`);
      setTitle(""); setDescription(""); setOptions([{ ticker: "", ca: "" }, { ticker: "", ca: "" }]);
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
  }

  return (
    <div className="corp-card p-6 space-y-4 max-w-2xl">
      <div className="label mb-1">Motion Title</div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="inp" placeholder="e.g. Distribution #1 — Which coin should we buy?" />
      <div className="label mb-1">Description (optional)</div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="inp" />
      <div className="label mb-1">Coin options</div>
      <div className="space-y-3">
        {options.map((o, i) => (
          <div key={i} className="flex gap-2">
            <input value={o.ticker} onChange={(e) => updateOption(i, "ticker", e.target.value)}
              className="inp w-28" placeholder={`Ticker`} />
            <input value={o.ca} onChange={(e) => updateOption(i, "ca", e.target.value)}
              className="inp flex-1 font-mono text-xs" placeholder="Contract address (optional)" />
          </div>
        ))}
        <button onClick={() => setOptions([...options, { ticker: "", ca: "" }])} className="btn text-xs">+ Add option</button>
      </div>
      <div className="label mb-1">Duration (hours)</div>
      <input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="inp w-24" />
      <button onClick={submit} className="btn-primary">Open Meeting</button>
      {status && <div className="text-xs text-accent">{status}</div>}
      <style jsx>{`.inp{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(245,241,232,0.15);padding:8px 12px;font-family:ui-monospace,monospace;font-size:13px;color:#f5f1e8;}`}</style>
    </div>
  );
}

function CreateDistribution({ password }: { password: string }) {
  const [distMint, setDistMint] = useState("");
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [decimals, setDecimals] = useState("6");
  const [preview, setPreview] = useState<any>(null);
  const [status, setStatus] = useState("");

  async function runPreview() {
    setStatus("Snapshotting…");
    try {
      const mint = process.env.NEXT_PUBLIC_TOKEN_MINT;
      const res = await fetch(`/api/holders?mint=${mint}&count=100`);
      const d = await res.json();
      setPreview(d.holders);
      setStatus(`✓ ${d.holders.length} holders snapshotted.`);
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
  }

  async function commitDistribution() {
    if (!preview) return setStatus("Run snapshot first");
    try {
      const res = await fetch("/api/distributions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword: password,
          tokenMint: distMint, tokenSymbol: symbol,
          totalAmountRaw: String(Math.floor(Number(amount) * 10 ** Number(decimals))),
          holders: preview,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setStatus(`✓ Distribution ${d.id} published.`);
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
  }

  return (
    <div className="corp-card p-6 space-y-4 max-w-2xl">
      <button onClick={runPreview} className="btn">Snapshot top 100 $MEME holders</button>
      {preview && <div className="text-xs text-muted">✓ {preview.length} holders</div>}
      <input className="inp" placeholder="Token mint address" value={distMint} onChange={(e) => setDistMint(e.target.value)} />
      <div className="flex gap-3">
        <input className="inp" placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <input className="inp" placeholder="Total amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="inp w-24" placeholder="Decimals" value={decimals} onChange={(e) => setDecimals(e.target.value)} />
      </div>
      <button onClick={commitDistribution} className="btn-primary">Publish Distribution Record</button>
      {status && <div className="text-xs text-accent">{status}</div>}
      <style jsx>{`.inp{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(245,241,232,0.15);padding:8px 12px;font-family:ui-monospace,monospace;font-size:13px;color:#f5f1e8;}`}</style>
    </div>
  );
}

function ManageEmployees({ password }: { password: string }) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [handle, setHandle] = useState("");
  const [title, setTitle] = useState("");
  const [wallet, setWallet] = useState("");
  const [allocation, setAllocation] = useState("1");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then((d) => setEmployees(d.employees || []));
  }, []);

  async function hire() {
    if (!handle || !wallet) return setStatus("Handle and wallet required");
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword: password,
          employee: { handle, title, wallet, allocation: Number(allocation), status: "active" },
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setStatus("✓ Employee added");
      setHandle(""); setTitle(""); setWallet(""); setAllocation("1");
      fetch("/api/employees").then((r) => r.json()).then((d) => setEmployees(d.employees || []));
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
  }

  async function fire(w: string) {
    if (!confirm("Fire this employee?")) return;
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: password, action: "fire", wallet: w }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      fetch("/api/employees").then((r) => r.json()).then((d) => setEmployees(d.employees || []));
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
  }

  const active = employees.filter((e) => e.status === "active");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="corp-card p-6 space-y-3">
        <div className="label mb-2">Hire Employee</div>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="label text-[10px] mb-1">X Handle</div>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" className="inp w-full" />
          </div>
          <div className="flex-1">
            <div className="label text-[10px] mb-1">Title</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chief Meme Officer" className="inp w-full" />
          </div>
        </div>
        <div>
          <div className="label text-[10px] mb-1">Wallet Address</div>
          <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="Solana wallet" className="inp w-full font-mono text-xs" />
        </div>
        <div>
          <div className="label text-[10px] mb-1">Allocation (%)</div>
          <input type="number" value={allocation} onChange={(e) => setAllocation(e.target.value)} className="inp w-24" step="0.1" />
        </div>
        <button onClick={hire} className="btn-primary">Hire</button>
        {status && <div className="text-xs text-accent">{status}</div>}
        <style jsx>{`.inp{background:rgba(255,255,255,0.04);border:1px solid rgba(245,241,232,0.15);padding:8px 12px;font-family:ui-monospace,monospace;font-size:13px;color:#f5f1e8;}`}</style>
      </div>

      <div className="space-y-2">
        <div className="label mb-2">Current Employees ({active.length})</div>
        {active.length === 0 && <div className="text-muted text-sm">No employees yet.</div>}
        {active.map((e) => (
          <div key={e.wallet} className="corp-card p-4 flex items-center justify-between">
            <div>
              <div className="font-bold">{e.handle} <span className="text-accent text-xs ml-2">{e.allocation}%</span></div>
              <div className="text-xs text-muted">{e.title} · {e.wallet.slice(0, 8)}…{e.wallet.slice(-6)}</div>
            </div>
            <button onClick={() => fire(e.wallet)}
              className="btn text-xs border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white shrink-0 ml-4">
              Fire
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClearData({ password }: { password: string }) {
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  async function clear(target: string) {
    const label = target.charAt(0).toUpperCase() + target.slice(1);
    if (!confirm(`Clear all ${label}? This cannot be undone.`)) return;
    setStatuses((s) => ({ ...s, [target]: "Clearing…" }));
    try {
      const res = await fetch("/api/admin/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, target }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setStatuses((s) => ({ ...s, [target]: `✓ ${label} cleared` }));
    } catch (e: any) {
      setStatuses((s) => ({ ...s, [target]: `Error: ${e.message}` }));
    }
  }

  const items = [
    { target: "meetings", label: "Past Meetings & Votes", desc: "Removes all meetings and vote records" },
    { target: "distributions", label: "Distribution History", desc: "Removes all distribution records" },
    { target: "suggestions", label: "Coin Suggestions", desc: "Clears the entire suggestions board" },
    { target: "chat", label: "Chat Messages", desc: "Wipes all chat messages immediately" },
  ];

  return (
    <div className="max-w-2xl space-y-3">
      {items.map(({ target, label, desc }) => (
        <div key={target} className="corp-card p-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-sm">{label}</div>
            <div className="text-xs text-muted">{desc}</div>
            {statuses[target] && <div className="text-xs text-accent mt-1">{statuses[target]}</div>}
          </div>
          <button onClick={() => clear(target)}
            className="btn text-xs border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white shrink-0 ml-4">
            Clear
          </button>
        </div>
      ))}
    </div>
  );
}
