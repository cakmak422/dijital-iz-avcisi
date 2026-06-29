import { NextResponse } from "next/server";
import { getAllContent } from "@/lib/contentDb";

export const dynamic = "force-dynamic";

export async function GET() {
  const content = await getAllContent();
  return NextResponse.json({ ok: true, content });
}
