# SyncMate Security Checklist Reference

## 1. Authentication & Access Control
- [ ] Every non-public route has `authenticate` middleware.
- [ ] Every group-scoped route has `requireGroup` middleware.
- [ ] Owner-only routes have `requireOwner` middleware.
- [ ] Cross-group queries return `404 Not Found` (never 403) to prevent resource existence enumeration.

## 2. Input Validation & Injection Defense
- [ ] Every endpoint has a Zod schema that strips unknown fields.
- [ ] Route parameters (`:id`, `:gid`) verified with `mongoose.isValidObjectId`.
- [ ] No raw `req.body` passed directly into Mongoose filters (prevents `$where` / `$gt` operator injection).
- [ ] URLs allow only `http` and `https` schemes (rejects XSS via `javascript:`).

## 3. Cryptography & Secret Protection
- [ ] Passwords hashed with `bcryptjs` cost factor >= 12.
- [ ] Refresh tokens stored as SHA-256 hashes; rotating with reuse detection.
- [ ] Google Calendar refresh tokens encrypted with AES-256-GCM using `ENCRYPTION_KEY`.
- [ ] Serializers explicitly omit `passwordHash`, `refreshTokenEnc`, `tokenHash`, and `__v`.
- [ ] Logger configured with serializers redacting `authorization`, `cookie`, `password`.

## 4. Network & DoS Hardening
- [ ] Helmet headers enabled with secure defaults.
- [ ] CORS allowlist configured strictly from `CORS_ORIGINS`.
- [ ] Global rate limiter (100 req/min/IP) and strict auth limiter (10 req/min/IP).
- [ ] JSON body parsing capped at 1 MB.
- [ ] Error handler suppresses stack traces when `NODE_ENV === 'production'`.

