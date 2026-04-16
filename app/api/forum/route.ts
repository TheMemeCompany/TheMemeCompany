import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Suggestion = {
  id: string;
  ticker: string;
  ca: string;
  reason: string;
  submittedBy: string;
  timestamp: number;
  votes: number;
  voters: string[]; // IPs or handles to prevent double voting
};

export async function GET() {
  const suggestions = await readData<Suggestion[]>("suggestions", []);
  return NextResponse.json({
    suggestions: suggestions.sort((a, b) => b.votes - a.votes),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { ticker, ca, reason, submittedBy } = await req.json();
    if (!ticker?.trim()) return NextResponse.json({ error: "Ticker required" }, { status: 400 });

    const suggestions = await readData<Suggestion[]>("suggestions", []);

    // Prevent duplicate CAs
    if (ca && suggestions.find((s) => s.ca === ca.trim())) {
      return NextResponse.json({ error: "This coin has already been submitted" }, { status: 400 });
    }

    const suggestion: Suggestion = {
      id: `sug_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ticker: ticker.trim().toUpperCase().replace("$", ""),
      ca: ca?.trim() || "",
      reason: reason?.trim().slice(0, 280) || "",
      submittedBy: submittedBy?.trim().slice(0, 32) || "Anonymous",
      timestamp: Date.now(),
      votes: 1,
      voters: [],
    };
    suggestions.push(suggestion);
    await writeData("suggestions", suggestions);

    // Post to all active meeting chats + general
    const meetings = await readData<any[]>("meetings", []);
    const now = Date.now();
    const activeMeetingIds = meetings
      .filter((m: any) => m.endsAt > now)
      .map((m: any) => m.id);
    const targets = ["general", ...activeMeetingIds];

    const chatMessages = await readData<any[]>("chat", []);
    const msgText = `${suggestion.submittedBy} suggested $${suggestion.ticker}${suggestion.reason ? ` — "${suggestion.reason}"` : ""}`;
    for (const meetingId of targets) {
      chatMessages.push({
        id: `${Date.now()}_sug_${meetingId}`,
        meetingId,
        handle: "📋 Suggestions",
        text: msgText,
        timestamp: Date.now(),
        isSystem: true,
      });
    }
    await writeData("chat", chatMessages);

    return NextResponse.json({ ok: true, suggestion });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
