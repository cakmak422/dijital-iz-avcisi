export type MockEmailResult = {
  delivered: boolean;
  provider: "mock";
  messageId: string;
};

export async function sendOtpEmail(email: string, code: string): Promise<MockEmailResult> {
  // TODO: Replace mock delivery with a real provider before production.
  // Candidate providers: Resend, SendGrid, Mailgun, Amazon SES, SMTP, Gmail SMTP.
  console.info(`[mock-email] OTP code ${code} would be sent to ${email}`);

  return {
    delivered: true,
    provider: "mock",
    messageId: `mock-${Date.now()}`
  };
}
