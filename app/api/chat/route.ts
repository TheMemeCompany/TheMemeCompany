import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  id: string;
  meetingId: string;
  handle: string;
  text: string;
  timestamp: number;
};

const MAX_MESSAGES = 200;
const CLEAR_EVERY_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const meetingId = req.nextUrl.searchParams.get("meetingId");
  const since = Number(req.nextUrl.searchParams.get("since") || "0");
  let messages = await readData<ChatMessage[]>("chat", []);

  // Auto-clear messages older than 5 minutes
  const cutoff = Date.now() - CLEAR_EVERY_MS;
  const cleared = messages.filter((m) => m.timestamp > cutoff);
  if (cleared.length !== messages.length) {
    await writeData("chat", cleared);
    messages = cleared;
  }

  const filtered = messages
    .filter((m) => (!meetingId || m.meetingId === meetingId) && m.timestamp > since)
    .slice(-100);
  return NextResponse.json({ messages: filtered });
}

export async function POST(req: NextRequest) {
  try {
    const { meetingId, handle, text } = await req.json();
    if (!handle?.trim() || !text?.trim()) return NextResponse.json({ error: "Handle and message required" }, { status: 400 });
    if (text.length > 280) return NextResponse.json({ error: "Message too long" }, { status: 400 });

    const messages = await readData<ChatMessage[]>("chat", []);
    const msg: ChatMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      meetingId: meetingId || "general",
      handle: handle.trim().slice(0, 32),
      text: text.trim(),
      timestamp: Date.now(),
    };
    messages.push(msg);
    // Keep only last MAX_MESSAGES
    if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);
    await writeData("chat", messages);
    return NextResponse.json({ ok: true, message: msg });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
