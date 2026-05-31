import { NextResponse } from "next/server";
import { CONTACT_EMAIL } from "@/lib/contactConfig";
import { sendContactEmail } from "@/lib/serverEmail";
import { isValidEmail, sanitizeMultiline, sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string; topic?: string; message?: string };
    const name = sanitizeText(String(body.name ?? ""), 80);
    const email = sanitizeText(String(body.email ?? ""), 120).toLowerCase();
    const topic = sanitizeText(String(body.topic ?? ""), 80);
    const message = sanitizeMultiline(String(body.message ?? ""), 1500);

    if (!name || !email || !topic || !message) {
      return NextResponse.json({ ok: false, error: "Tum alanlar zorunludur." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Gecerli bir e-posta adresi girin." }, { status: 400 });
    }

    const result = await sendContactEmail({ name, email, topic, message });
    return NextResponse.json({ ok: true, to: CONTACT_EMAIL, provider: result.provider, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mesaj gonderilemedi.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
