"use client";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function checkClientRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000)
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// TODO: Redis tabanli rate limit, IP bazli throttle ve Cloudflare Turnstile
// backend/API katmaninda uygulanacak. Client helper yalnızca demo koruma katmanidir.
// TODO: Production abuse prevention için suspicious request scoring, geciçi IP ban,
// brute force monitoring, anomaly detection ve audit logging backend tarafina tasinacak.
