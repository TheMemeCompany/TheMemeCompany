import { NextRequest, NextResponse } from "next/server";
import { readData, writeData, Vote, Meeting } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { meetingId, choice, voterId } = await req.json();
    if (!meetingId || choice === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const meetings = await readData<Meeting[]>("meetings", []);
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    if (Date.now() > meeting.endsAt) return NextResponse.json({ error: "Meeting closed" }, { status: 400 });
    if (choice < 0 || choice >= meeting.options.length) return NextResponse.json({ error: "Invalid choice" }, { status: 400 });

    const id = voterId || crypto.randomUUID();

    const votes = await readData<Vote[]>("votes", []);
    const filtered = votes.filter((v) => !(v.meetingId === meetingId && v.wallet === id));
    filtered.push({
      meetingId,
      wallet: id,
      choice,
      weight: 1,
      signature: "",
      signedMessage: "",
      timestamp: Date.now(),
    });
    await writeData("votes", filtered);
    return NextResponse.json({ ok: true, weight: 1 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
