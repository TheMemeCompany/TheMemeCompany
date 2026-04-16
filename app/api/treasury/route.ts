import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/solana";
import { PublicKey } from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });
  try {
    const conn = getConnection();
    const lamports = await conn.getBalance(new PublicKey(wallet));
    return NextResponse.json({ solBalance: lamports / 1e9 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
