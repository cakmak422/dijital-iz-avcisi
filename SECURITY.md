# Dijital Iz Avcisi Security Notes

## Current Status

> WARNING:
> Current mock authentication is NOT secure and MUST NOT be considered production authentication.
> Production auth requires backend validation, database-backed sessions, server-side authorization, and HttpOnly Secure cookies.

- Production UI does not expose demo admin credentials, demo user credentials, OTP debug codes, API keys, tokens, or admin passwords.
- Internal console routes are protected by Next.js proxy middleware and require an admin role cookie before rendering.
- Client-side mock auth is not a production authentication system. Real deployment must use backend sessions or signed JWT cookies.
- If any password or admin credential was previously committed to Git history, treat it as exposed and rotate it before public release.

## Threat Model

Current primary threat assumptions:

- Credential stuffing
- Brute force attacks
- Automated scraping abuse
- Fake account creation
- Spam analysis submissions
- XSS attempts
- CSRF attempts
- SSRF attempts from future URL analysis features
- Admin panel probing
- Bot traffic and reconnaissance scanning
- Public endpoint abuse
- Dependency supply-chain risks

Future production deployment must continuously reassess the threat model as new analysis features are introduced.

## SSRF Protection Requirements

Future URL and product analysis engines must:

- Block localhost and private IP ranges
- Block internal network access
- Restrict unsupported protocols
- Validate outbound requests
- Enforce DNS rebinding protections
- Use outbound allowlists when possible

Analysis engines must never access internal infrastructure.

## Cloudflare Checklist

1. Create a Cloudflare account.
2. Add the domain to Cloudflare.
3. Replace Hostinger nameservers with Cloudflare nameservers.
4. Enable the orange-cloud proxy for DNS records.
5. Set SSL/TLS mode to Full.
6. Enable WAF managed rules.
7. Enable Bot Fight Mode.
8. Add an extra WAF rule for `/ops-console*` and optionally block noisy `/admin*` probes.
9. Consider Cloudflare Turnstile for login, register, contact, and analysis forms.

## Origin IP Protection

- Keep the real server IP private.
- Manage DNS through Cloudflare proxy.
- Do not publish direct Render/Railway/Hostinger origin URLs in public pages.
- Internal console routes should be additionally protected with Cloudflare WAF rules.
- Future production can use an IP allowlist for admin routes.

## Admin IP Allowlist Preparation

Environment example:

```env
ADMIN_ALLOWED_IPS=
```

TODO: In production behind Cloudflare, read `CF-Connecting-IP` and enforce allowlist checks together with backend session validation.

## Rate Limit Roadmap

- Redis-based rate limit for login, register, contact, feedback, and analysis endpoints.
- IP-based throttling behind reverse proxy.
- Cloudflare Turnstile on high-risk forms.
- Separate stricter policy for internal console login attempts.

## Abuse Prevention Roadmap

Future production deployment should include:

- Anti-bot protection with Cloudflare Turnstile or an equivalent challenge system.
- Automated abuse detection for repeated failed login, registration, analysis, and report submissions.
- Suspicious request scoring based on velocity, route type, user agent, ASN, country, and historical behavior.
- Temporary IP bans for brute force attempts and high-volume abusive requests.
- Brute force monitoring for login, OTP verification, and admin console access.
- Anomaly detection for sudden spikes in analysis volume, repeated target URLs, or repeated failed parser calls.
- Central audit events for blocked requests, suspicious sessions, rate-limit hits, and admin actions.

Recommended production components:

- Redis or managed KV for shared rate-limit counters.
- WAF rules for `/ops-console*`, auth routes, and analysis endpoints.
- Bot Fight Mode / Turnstile on public forms.
- Alerting for abuse spikes and repeated failed authorization attempts.

## Secret Management

- `.env.local` must not be committed.
- `.env.example` must contain examples only.
- Hostinger or deployment provider Environment Variables should hold real secrets.
- `NEXT_PUBLIC_` variables are public and must never contain secrets.

## Session Cookie Requirements

Production authentication cookies must be created server-side only:

```http
Set-Cookie: __Host-dia_session=<signed-session>; Path=/; HttpOnly; Secure; SameSite=Lax
```

- Use `HttpOnly` so JavaScript cannot read session cookies.
- Use `Secure` so cookies are sent only over HTTPS.
- Use `SameSite=Lax` or `SameSite=Strict`.
- Do not use client-readable auth cookies for roles or tokens.
- Admin authorization must be verified server-side from a signed session or backend lookup.

## Logging Policy

Never log:

- Passwords
- OTP codes
- Tokens
- Cookies
- Session identifiers
- Personal phone numbers
- Full email contents

Production logs must be sanitized before storage. When correlation is needed, store a non-reversible fingerprint instead of raw personal data.

## Dependency Maintenance

Dependencies must be checked and updated regularly before production release.

Required checks:

```bash
npm run security:audit
npm audit
```

Recommended automation:

- Enable GitHub Dependabot for npm and pip updates.
- Consider Renovate if grouped update rules need to be more advanced.
- Run Snyk before production release and after major dependency changes.
- Patch known vulnerable or deprecated packages quickly.

Current repo includes `.github/dependabot.yml` for weekly npm and backend pip checks.

## Supply Chain Security

Third-party dependencies introduce supply-chain risk.

Mitigations should include:

- Dependency pinning
- Lockfile verification
- Automated vulnerability scanning
- Restricted dependency additions
- Review before introducing new packages

## Incident Response

If a security incident occurs:

1. Rotate secrets immediately
2. Disable affected services
3. Preserve logs
4. Assess scope of compromise
5. Notify affected administrators
6. Patch root cause
7. Reissue credentials if needed

## Backup and Recovery

Production deployment should include:

- Automated database backups
- GitHub repository redundancy
- Environment variable backup procedures
- Disaster recovery documentation
