import { NextRequest, NextResponse } from "next/server";
import { readData, writeData, Distribution } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Registers a claim. In this MVP, actual token transfer is executed off-chain
 * by the treasury operator (or by a Solana program you deploy later).
 * Once claims are registered, run a batch send from the treasury wallet.
 */
export async function POST(req: NextRequest) {
  try {
    const { distId, wallet } = await req.json();
    const distributions = await readData<Distribution[]>("distributions", []);
    const dist = distributions.find((d) => d.id === distId);
    if (!dist) return NextResponse.json({ error: "Distribution not found" }, { status: 404 });
    if (!dist.proofs[wallet]) return NextResponse.json({ error: "Not eligible for this distribution" }, { status: 403 });
    if (dist.claimed.includes(wallet)) return NextResponse.json({ error: "Already claimed" }, { status: 400 });

    dist.claimed.push(wallet);
    await writeData("distributions", distributions);
    return NextResponse.json({
      ok: true,
      tokenSymbol: dist.tokenSymbol,
      humanAmount: Number(dist.proofs[wallet].amount) / 1e6,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
