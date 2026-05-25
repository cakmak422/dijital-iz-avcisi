type LogValue = string | number | boolean | null | undefined;

const sensitiveKeyPattern = /(password|otp|token|cookie|session|phone|email|mail|secret|code)/i;

function maskValue(key: string, value: LogValue) {
  if (value === null || value === undefined) return value;
  if (!sensitiveKeyPattern.test(key)) return value;
  return "[redacted]";
}

export function sanitizeLogFields(fields: Record<string, LogValue>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, maskValue(key, value)]));
}

export function safeInfo(message: string, fields: Record<string, LogValue> = {}) {
  if (process.env.NODE_ENV === "production") return;
  // Development-only logger. Never pass raw passwords, OTP codes, tokens, cookies,
  // session identifiers, phone numbers, or full email contents.
  console.info(message, sanitizeLogFields(fields));
}
