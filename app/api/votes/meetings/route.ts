import { NextRequest, NextResponse } from "next/server";
import { readData, writeData, Meeting } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const meetings = await readData<Meeting[]>("meetings", []);
  return NextResponse.json({ meetings: meetings.sort((a, b) => b.createdAt - a.createdAt) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, options, durationHours, adminPassword } = body;

  const correctPassword = process.env.ADMIN_PASSWORD;
  if (!correctPassword || adminPassword !== correctPassword) {
    return NextResponse.json({ error: "Invalid admin password" }, { status: 403 });
  }
  if (!title || !options || options.length < 2) {
    return NextResponse.json({ error: "Need title and at least 2 options" }, { status: 400 });
  }

  const meetings = await readData<Meeting[]>("meetings", []);
  const now = Date.now();
  const meeting: Meeting = {
    id: `mtg_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    description: description || "",
    options,
    createdAt: now,
    endsAt: now + (Number(durationHours) || 24) * 3600 * 1000,
    createdBy: "admin",
  };
  meetings.push(meeting);
  await writeData("meetings", meetings);
  return NextResponse.json({ meeting });
}
