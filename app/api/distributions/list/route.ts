import { NextResponse } from "next/server";
import { readData, Distribution } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const distributions = await readData<Distribution[]>("distributions", []);
  // strip proofs from list view (too big)
  const summary = distributions.map((d) => ({
    id: d.id,
    createdAt: d.createdAt,
    tokenMint: d.tokenMint,
    tokenSymbol: d.tokenSymbol,
    totalAmount: d.totalAmount,
    merkleRoot: d.merkleRoot,
    recipients: Object.keys(d.proofs).length,
    claimedCount: d.claimed.length,
  }));
  return NextResponse.json({ distributions: summary.sort((a, b) => b.createdAt - a.createdAt) });
}
