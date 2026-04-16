"use client";
import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  handle: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
};

const COLORS = ["#ff5c1f", "#00d4ff", "#ff3cac", "#36ff4f", "#ffe600", "#a855f7"];
function colorFor(handle: string) {
  let hash = 0;
  for (const c of handle) hash = (hash * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[hash];
}

export default function LiveChat({ meetingId = "general", fullHeight = false }: { meetingId?: string; fullHeight?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [handle, setHandle] = useState("");
  const [savedHandle, setSavedHandle] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("mc_handle") || "";
    return "";
  });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sinceRef = useRef(0);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat?meetingId=${meetingId}&since=${sinceRef.current}`);
        const d = await res.json();
        if (d.messages?.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const newMsgs = d.messages.filter((m: ChatMessage) => !ids.has(m.id));
            return [...prev, ...newMsgs].slice(-150);
          });
          sinceRef.current = d.messages[d.messages.length - 1].timestamp;
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 2500);
    return () => clearInterval(id);
  }, [meetingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function saveHandle() {
    if (!handle.trim()) return;
    const h = handle.trim().slice(0, 32);
    setSavedHandle(h);
    localStorage.setItem("mc_handle", h);
  }

  async function send() {
    if (!savedHandle || !text.trim()) return;
    setSending(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, handle: savedHandle, text: text.trim() }),
      });
      setText("");
    } catch {}
    setSending(false);
  }

  const height = fullHeight ? "h-[calc(100vh-200px)]" : "h-[520px]";

  return (
    <div className={`corp-border flex flex-col ${height}`}>
      <div className="border-b border-white/10 px-4 py-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-xs uppercase tracking-widest">
          {meetingId === "general" ? "Community Chat" : "Meeting Chat"}
        </span>
        <span className="text-xs text-muted ml-auto">{messages.length} messages</span>
        {savedHandle && (
          <span className="text-xs font-bold" style={{ color: colorFor(savedHandle) }}>
            {savedHandle}
          </span>
        )}
      </div>

      {!savedHandle && (
        <div className="p-4 border-b border-white/10">
          <div className="label mb-2">Pick a name to chat</div>
          <div className="flex gap-2">
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="Your name or @handle"
              className="flex-1 bg-white/5 border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-accent"
              onKeyDown={(e) => e.key === "Enter" && saveHandle()}
            />
            <button onClick={saveHandle} className="btn-primary">Join</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && (
          <div className="text-muted text-xs text-center mt-12">No messages yet. Be the first.</div>
        )}
        {messages.map((m) => (
          m.isSystem ? (
            <div key={m.id} className="text-xs py-1 px-2 bg-accent/10 border-l-2 border-accent text-accent/90 leading-snug">
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="text-sm leading-snug">
              <span className="font-bold mr-2" style={{ color: colorFor(m.handle) }}>{m.handle}</span>
              <span className="text-paper/90">{m.text}</span>
            </div>
          )
        ))}
        <div ref={bottomRef} />
      </div>

      {savedHandle && (
        <div className="border-t border-white/10 p-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Say something…"
            maxLength={280}
            className="flex-1 bg-white/5 border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <button onClick={send} disabled={sending || !text.trim()} className="btn-primary">
            {sending ? "…" : "Send"}
          </button>
        </div>
      )}
    </div>
  );
}
