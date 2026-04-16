import { NextRequest, NextResponse } from "next/server";
import { readData, writeData, Employee } from "@/lib/store";
import { verifySignature } from "@/lib/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const employees = await readData<Employee[]>("employees", []);
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  try {
    const { creatorWallet, signature, signedMessage, employee } = await req.json();
    const admins = (process.env.ADMIN_WALLETS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!admins.includes(creatorWallet)) return NextResponse.json({ error: "Admin only" }, { status: 403 });
    if (!verifySignature(signedMessage, signature, creatorWallet)) return NextResponse.json({ error: "Bad sig" }, { status: 401 });

    const employees = await readData<Employee[]>("employees", []);
    const existing = employees.findIndex((e) => e.wallet === employee.wallet);
    if (existing >= 0) employees[existing] = employee;
    else employees.push(employee);
    await writeData("employees", employees);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
