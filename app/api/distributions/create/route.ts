import { NextRequest, NextResponse } from "next/server";
import { readData, writeData, Distribution } from "@/lib/store";
import { buildMerkleTree } from "@/lib/merkle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { adminPassword, tokenMint, tokenSymbol, totalAmountRaw, holders } = await req.json();
    const correctPassword = process.env.ADMIN_PASSWORD;
    if (!correctPassword || adminPassword !== correctPassword) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 403 });
    }
    if (!holders || holders.length === 0) return NextResponse.json({ error: "No holders" }, { status: 400 });

    const totalWeight = holders.reduce((s: number, h: any) => s + h.amount, 0);
    const totalAmt = BigInt(totalAmountRaw);
    const leaves = holders.map((h: any) => {
      const share = (BigInt(h.amount) * totalAmt) / BigInt(totalWeight);
      return { wallet: h.owner, amount: share.toString() };
    });
    const { root, proofs } = buildMerkleTree(leaves);

    const distributions = await readData<Distribution[]>("distributions", []);
    const id = `dist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const dist: Distribution = {
      id, createdAt: Date.now(), tokenMint, tokenSymbol,
      totalAmount: totalAmountRaw, merkleRoot: root, proofs, claimed: [],
    };
    distributions.push(dist);
    await writeData("distributions", distributions);
    return NextResponse.json({ id, merkleRoot: root, recipients: leaves.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
