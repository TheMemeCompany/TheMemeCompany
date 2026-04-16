import { NextRequest, NextResponse } from "next/server";
import { readData, Distribution } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  const distributions = await readData<Distribution[]>("distributions", []);
  const claims = distributions
    .filter((d) => d.proofs[wallet])
    .map((d) => {
      const raw = d.proofs[wallet].amount;
      return {
        distId: d.id,
        tokenMint: d.tokenMint,
        tokenSymbol: d.tokenSymbol,
        rawAmount: raw,
        humanAmount: Number(raw) / 1e6, // assume 6 decimals - adjust if needed
        claimed: d.claimed.includes(wallet),
      };
    });
  return NextResponse.json({ claims });
}
