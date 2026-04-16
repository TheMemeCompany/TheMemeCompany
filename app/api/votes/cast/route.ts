import { NextRequest, NextResponse } from "next/server";
import { readData, writeData, Vote, Meeting } from "@/lib/store";
import { getTokenBalance, getTotalSupply } from "@/lib/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { meetingId, wallet, choice } = await req.json();
    if (!meetingId || !wallet) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const meetings = await readData<Meeting[]>("meetings", []);
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    if (Date.now() > meeting.endsAt) return NextResponse.json({ error: "Meeting closed" }, { status: 400 });
    if (choice < 0 || choice >= meeting.options.length) return NextResponse.json({ error: "Invalid choice" }, { status: 400 });

    const mint = process.env.NEXT_PUBLIC_TOKEN_MINT;
    if (!mint) return NextResponse.json({ error: "Token mint not configured" }, { status: 500 });

    const balance = await getTokenBalance(wallet, mint);
    const supply = await getTotalSupply(mint);
    const threshold = Number(process.env.NEXT_PUBLIC_VOTING_THRESHOLD || "0.0005");
    const minBalance = supply * threshold;

    if (balance < minBalance) {
      return NextResponse.json({
        error: `Below voting threshold. You hold ${((balance / supply) * 100).toFixed(4)}%, need ${(threshold * 100).toFixed(2)}%.`,
      }, { status: 403 });
    }

    const votes = await readData<Vote[]>("votes", []);
    const filtered = votes.filter((v) => !(v.meetingId === meetingId && v.wallet === wallet));
    filtered.push({
      meetingId, wallet, choice,
      weight: balance,
      signature: "",
      signedMessage: "",
      timestamp: Date.now(),
    });
    await writeData("votes", filtered);
    return NextResponse.json({ ok: true, weight: balance });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
