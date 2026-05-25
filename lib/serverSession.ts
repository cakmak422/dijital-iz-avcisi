import { createHmac, timingSafeEqual } from "crypto";

export type ServerSessionPayload = {
  email: string;
  role: "admin" | "user";
  exp: number;
};

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createServerSession(payload: ServerSessionPayload, secret: string) {
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyServerSession(token: string | undefined, secret: string): ServerSessionPayload | null {
  if (!token || !secret || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = signPayload(encodedPayload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as ServerSessionPayload;
    if (!payload.email || !payload.role || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
