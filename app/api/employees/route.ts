import { NextRequest, NextResponse } from "next/server";
import { readData, writeData, Employee } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const employees = await readData<Employee[]>("employees", []);
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  try {
    const { adminPassword, employee, action, wallet } = await req.json();
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const employees = await readData<Employee[]>("employees", []);

    if (action === "fire") {
      const idx = employees.findIndex((e) => e.wallet === wallet);
      if (idx >= 0) employees[idx].status = "fired";
      await writeData("employees", employees);
      return NextResponse.json({ ok: true });
    }

    // Add or update
    const existing = employees.findIndex((e) => e.wallet === employee.wallet);
    if (existing >= 0) employees[existing] = employee;
    else employees.push({ ...employee, hiredAt: Date.now(), status: "active" });
    await writeData("employees", employees);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
