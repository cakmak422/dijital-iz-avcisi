const isProduction = process.env.NODE_ENV === "production";

function getApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "";

  try {
    return new URL(apiUrl).origin;
  } catch {
    return "";
  }
}

function buildContentSecurityPolicy() {
  const apiOrigin = getApiOrigin();
  const connectSources = ["'self'", ...(apiOrigin ? [apiOrigin] : [])];

  const directives = [
    "default-src 'self'",
    isProduction ? "script-src 'self'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  return directives.join("; ");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy()
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
