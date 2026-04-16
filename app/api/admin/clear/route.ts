import { NextRequest, NextResponse } from "next/server";
import { writeData } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { password, target } = await req.json();
  const correct = process.env.ADMIN_PASSWORD;
  if (!correct || password !== correct) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  switch (target) {
    case "meetings":
      await writeData("meetings", []);
      await writeData("votes", []);
      break;
    case "distributions":
      await writeData("distributions", []);
      break;
    case "suggestions":
      await writeData("suggestions", []);
      break;
    case "chat":
      await writeData("chat", []);
      break;
    default:
      return NextResponse.json({ error: "Unknown target" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
