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
  voters: string[];
};

export async function POST(req: NextRequest) {
  try {
    const { id, voterKey } = await req.json(); // voterKey = handle or IP
    if (!id || !voterKey) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const suggestions = await readData<Suggestion[]>("suggestions", []);
    const sug = suggestions.find((s) => s.id === id);
    if (!sug) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (sug.voters.includes(voterKey)) {
      return NextResponse.json({ error: "Already voted" }, { status: 400 });
    }
    sug.votes += 1;
    sug.voters.push(voterKey);
    await writeData("suggestions", suggestions);
    return NextResponse.json({ ok: true, votes: sug.votes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
