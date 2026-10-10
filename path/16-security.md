# Web Security

> Stage: 3 · Advanced
> The browser runs untrusted code next to your users' data. Know the attacks, the platform's defences, and where the frontend's responsibility ends.

## The security model

- [ ] Same-origin policy - define an origin and what the policy isolates
- [ ] CORS - simple vs preflighted requests, credentials, and how to configure it correctly
- [ ] Trust boundaries - never trust the client; validation in the UI is UX, not security
- [ ] Threat modelling - list assets, attackers, and entry points for a feature

## Attacks and defences

- [ ] XSS - stored, reflected, and DOM-based; how frameworks escape and where they don't
- [ ] Dangerous sinks - `innerHTML`, `dangerouslySetInnerHTML`, `javascript:` URLs, `eval`
- [ ] Sanitisation - DOMPurify and the Sanitizer API for user-supplied HTML
- [ ] Content Security Policy - write a strict nonce-based CSP and roll it out in report-only mode
- [ ] Trusted Types - lock down DOM sinks
- [ ] CSRF - how it works; `SameSite` cookies, Fetch Metadata, and tokens as defences
- [ ] Clickjacking - `frame-ancestors` and `X-Frame-Options`
- [ ] Open redirects - validate redirect targets
- [ ] Prototype pollution - recognise and avoid it
- [ ] Supply chain attacks - lockfiles, audits, minimal dependencies, release-age cooldowns, blocked install scripts, provenance
- [ ] Subresource Integrity - pin third-party scripts
- [ ] Sandboxing untrusted content - isolate user content and third-party widgets with sandboxed iframes and a separate origin
- [ ] File upload handling - validate type and size, never trust the file name, and serve uploads from a separate origin
- [ ] LLM output and prompt injection - treat model output as untrusted input, and limit what an AI feature is allowed to do
- [ ] `postMessage` safety - always verify `origin`

## Authentication and sessions

- [ ] Cookie attributes - `HttpOnly`, `Secure`, `SameSite`, prefixes, scope
- [ ] Sessions vs JWTs - trade-offs, and why tokens in `localStorage` are risky
- [ ] OAuth 2.0 and OIDC - authorisation code flow with PKCE
- [ ] Passkeys and WebAuthn - how phishing-resistant auth works
- [ ] Multi-factor and account recovery - the UX of doing them safely
- [ ] Authorisation in the UI - hiding a button isn't access control
- [ ] Rate limiting and abuse prevention - throttling, bot defences, and what the frontend can and cannot enforce

## Transport and headers

- [ ] HTTPS everywhere - HSTS and mixed content
- [ ] Security headers - `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- [ ] Cross-origin isolation - COOP, COEP, CORP and why `SharedArrayBuffer` needs them
- [ ] Secrets - nothing secret ships to the client; keep keys server-side

## Privacy

- [ ] Data minimisation - collect and store only what's needed
- [ ] Consent and regulation - GDPR and cookie consent basics
- [ ] Third-party tracking - understand what you embed and what it collects
- [ ] Sensitive data in the UI - logs, analytics, error reports, and URLs

## Practice

- [ ] Exploit then fix - work through XSS and CSRF labs on a deliberately vulnerable app
- [ ] Harden a project - add a strict CSP and security headers to something you've deployed and score it
- [ ] Security review - review a feature of your own for the OWASP Top 10

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [web.dev: Strict CSP](https://web.dev/articles/strict-csp)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [MDN: Web security](https://developer.mozilla.org/en-US/docs/Web/Security)
