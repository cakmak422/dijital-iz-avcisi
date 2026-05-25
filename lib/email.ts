export type MockEmailResult = {
  delivered: boolean;
  provider: "mock";
  messageId: string;
};

export async function sendOtpEmail(email: string, code: string): Promise<MockEmailResult> {
  // TODO: Replace mock delivery with a real provider before production.
  // Candidate providers: Resend, SendGrid, Mailgun, Amazon SES, SMTP, Gmail SMTP.
  void email;
  void code;

  return {
    delivered: true,
    provider: "mock",
    messageId: `mock-${Date.now()}`
  };
}
