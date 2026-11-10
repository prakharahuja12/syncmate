# 09 – Security, Testing, Seed, Deploy, Acceptance

## Security checklist
helmet; CORS allowlist; rate limits (auth strict); zod validation + strip unknown; mongo-injection safe (never pass raw req.body into queries; cast ids with `mongoose.isValidObjectId`); bcrypt 12; JWT secrets ≥ 32 chars; refresh rotation + reuse detection; hash refresh tokens; AES-GCM for Google tokens; URL protocol allowlist (http/https); output serialization strips secrets; 1 MB body limit; no stack traces in production responses; audit that every route has auth + group check.

## Tests (Jest + Supertest + mongodb-memory-server)
Auth (signup, login, refresh rotation, reuse), groups (join, full, invalid code, remove), events (CRUD, filters, sort by priority, validation, cross-group 404), hackathon fields + `primaryUrl`, urgency, pins/status, reminders firing, notifications (actor excluded, assignees only), sockets, dashboard shape, Google (mocked). Coverage target ≥ 80% services.

## Seed script (`npm run seed`)
Creates group "Team Alpha" with 4 users (`alex@demo.com … password Demo@1234`), 25 events across categories/priorities incl. SIH 2026 (registration + official links), pins, statuses, reminders, notifications.

## Docs
Generate `openapi.yaml` (or Postman collection) from the contract. README with setup, env table, scripts, architecture diagram (mermaid), and how to configure Firebase + Google + SMTP.

## Deploy
Dockerfile (node:20-alpine, non-root), docker-compose (api + mongo), health check `/health`, notes for Render/Railway + MongoDB Atlas, env vars in host dashboard, `trust proxy` enabled behind proxy, enable HTTPS-only CORS origins in prod.

## FINAL ACCEPTANCE CHECKLIST
- [ ] A creates event for 15 Nov → B, C, D receive socket event + notification + push without any action.
- [ ] Update and delete produce notifications + realtime updates.
- [ ] Reminders (1d/12h/1h/30m/custom) fire once at the right time.
- [ ] Hackathon event returns registration + official links and `primaryUrl`.
- [ ] Priority sort and urgent flag correct; dashboard `nextHighPriority` correct.
- [ ] Pin by A is visible to B/C/D with who + when; each sets own status; "registered" notifies group.
- [ ] Registration-close reminders (7d/3d/1d/custom) work and stop after status = registered.
- [ ] Google sync creates exactly one copy per event per user; respects preferences; no duplicates after resync.
- [ ] No cross-group data leak in any endpoint (tests prove it).
