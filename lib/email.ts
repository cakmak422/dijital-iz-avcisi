import { Resend } from "resend";

export type EmailResult = {
  delivered: boolean;
  provider: "resend" | "mock";
  messageId: string;
  error?: string;
};

const FROM = "Dijital İz Avcısı <noreply@dijitalizavcisi.com>";

function getResendClient(): Resend | null {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  if (!key) return null;
  return new Resend(key);
}

export async function sendOtpEmail(email: string, code: string): Promise<EmailResult> {
  const resend = getResendClient();

  // Geliştirme ortamında veya key yoksa: mock (kod zaten ekranda gösteriliyor)
  if (!resend) {
    console.warn("[email] RESEND_API_KEY tanımlı değil — mock mod.");
    return { delivered: false, provider: "mock", messageId: `mock-${Date.now()}`, error: "RESEND_API_KEY tanımlı değil." };
  }

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020617;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:32px 16px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;overflow:hidden;max-width:520px;width:100%">
        <!-- Başlık -->
        <tr><td style="background:#0c1a2e;padding:24px 32px;border-bottom:1px solid #1e3a5f">
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#22d3ee">Dijital İz Avcısı</p>
          <p style="margin:6px 0 0;font-size:18px;font-weight:700;color:#f1f5f9">E-posta Doğrulama</p>
        </td></tr>
        <!-- İçerik -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:14px;color:#94a3b8">Hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
          <div style="margin:24px 0;text-align:center;background:#020617;border:1px solid #22d3ee33;border-radius:8px;padding:24px">
            <span style="font-size:40px;font-weight:800;letter-spacing:0.3em;color:#22d3ee;font-family:'Courier New',monospace">${code}</span>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#64748b">Bu kod <strong style="color:#94a3b8">5 dakika</strong> geçerlidir.</p>
          <p style="margin:0;font-size:13px;color:#64748b">Bu isteği siz yapmadıysanız bu e-postayı dikkate almayın.</p>
        </td></tr>
        <!-- Alt -->
        <tr><td style="padding:16px 32px;border-top:1px solid #1e3a5f">
          <p style="margin:0;font-size:12px;color:#475569">Dijital İz Avcısı · <a href="https://dijitalizavcisi.com" style="color:#22d3ee;text-decoration:none">dijitalizavcisi.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to:   [email],
      subject: "Dijital İz Avcısı — Doğrulama Kodunuz",
      html
    });

    if (error) {
      console.error("[email] Resend hatası:", error);
      return { delivered: false, provider: "resend", messageId: "", error: error.message };
    }

    return { delivered: true, provider: "resend", messageId: data?.id ?? "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bilinmeyen e-posta hatası";
    console.error("[email] Resend exception:", msg);
    return { delivered: false, provider: "resend", messageId: "", error: msg };
  }
}

export type NewsFetchAlertDetails = {
  reasons: string[];
  found: number;
  inserted: number;
  skipped: number;
  failed: number;
  aiAttempted: number;
  aiOk: number;
  truncationCount: number;
  sampleErrors: string[];
};

export async function sendNewsFetchAlertEmail(details: NewsFetchAlertDetails): Promise<EmailResult> {
  const to = (process.env.ALERT_EMAIL ?? "").trim();
  if (!to) {
    console.warn("[email] ALERT_EMAIL tanımlı değil — uyarı e-postası atlanıyor.");
    return { delivered: false, provider: "mock", messageId: `mock-${Date.now()}`, error: "ALERT_EMAIL tanımlı değil." };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY tanımlı değil — uyarı e-postası atlanıyor.");
    return { delivered: false, provider: "mock", messageId: `mock-${Date.now()}`, error: "RESEND_API_KEY tanımlı değil." };
  }

  const now = new Date();
  const timestamp = now.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const reasonsText = details.reasons.join(", ");

  const rows = [
    ["found", String(details.found)],
    ["inserted", String(details.inserted)],
    ["skipped", String(details.skipped)],
    ["failed", String(details.failed)],
    ["AI denenen", String(details.aiAttempted)],
    ["AI başarılı", String(details.aiOk)],
    ["Kırpma uyarısı", String(details.truncationCount)]
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;color:#94a3b8;font-size:13px">${label}</td><td style="padding:6px 12px;color:#e2e8f0;font-size:13px;font-weight:700">${value}</td></tr>`
    )
    .join("");

  const sampleErrorsHtml = details.sampleErrors.length
    ? `<p style="margin:16px 0 0;font-size:13px;color:#64748b">Örnek hata:</p>
       <p style="margin:4px 0 0;font-size:12px;color:#f87171;font-family:'Courier New',monospace;word-break:break-word">${details.sampleErrors[0]}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020617;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="background:#0c1a2e;padding:24px 32px;border-bottom:1px solid #1e3a5f">
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#f87171">⚠️ Haber Hattı Uyarısı</p>
          <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#f1f5f9">${reasonsText}</p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;border:1px solid #1e3a5f33;border-radius:8px">
            ${rows}
          </table>
          ${sampleErrorsHtml}
          <p style="margin:20px 0 0;font-size:12px;color:#475569">Zaman: ${timestamp} (Europe/Istanbul)</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #1e3a5f">
          <p style="margin:0;font-size:12px;color:#475569">Dijital İz Avcısı · Otomatik izleme mekanizması</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to:   [to],
      subject: `⚠️ Haber Hattı Uyarısı — ${now.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`,
      html
    });

    if (error) {
      console.error("[email] Resend hatası (alert):", error);
      return { delivered: false, provider: "resend", messageId: "", error: error.message };
    }

    return { delivered: true, provider: "resend", messageId: data?.id ?? "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bilinmeyen e-posta hatası";
    console.error("[email] Resend exception (alert):", msg);
    return { delivered: false, provider: "resend", messageId: "", error: msg };
  }
}
