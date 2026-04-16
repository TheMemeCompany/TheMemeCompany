import { NextRequest, NextResponse } from "next/server";
import { readData, Vote } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const meetingId = req.nextUrl.searchParams.get("meetingId");
  if (!meetingId) return NextResponse.json({ error: "meetingId required" }, { status: 400 });

  const votes = await readData<Vote[]>("votes", []);
  const tally: Record<number, { weight: number; voters: number }> = {};
  for (const v of votes.filter((x) => x.meetingId === meetingId)) {
    if (!tally[v.choice]) tally[v.choice] = { weight: 0, voters: 0 };
    tally[v.choice].weight += v.weight;
    tally[v.choice].voters += 1;
  }
  return NextResponse.json({ tally });
}
