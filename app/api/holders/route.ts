import { NextRequest, NextResponse } from "next/server";
import { fetchTopHolders } from "@/lib/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get("mint");
  const count = Number(req.nextUrl.searchParams.get("count") || "100");
  if (!mint) return NextResponse.json({ error: "mint required" }, { status: 400 });
  try {
    const holders = await fetchTopHolders(mint, count);
    return NextResponse.json({ holders, totalHolders: holders.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
