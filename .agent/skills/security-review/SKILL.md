---
name: security-review
description: Audits code changes and diffs against the SyncMate security checklist (auth guards, rate limiting, injection defense, token rotation, secret masking, and object ID validation). Trigger on "security", "security review", "audit code", "check vulnerability", or "security audit".
---

# Security Review (SyncMate Backend)

## Purpose
Enforces strict security checks on code changes and git diffs against the SyncMate security specification (doc 09), preventing data leaks, injection vulnerabilities, privilege escalations, and credential exposures.

## When to use
- Before finalizing any PR, git commit, or phase release.
- When creating or modifying auth, group, or integration endpoints.
- When reviewing a git diff for vulnerabilities.
- Triggers: "security", "security review", "audit code", "check vulnerability", "security audit".

## Step-by-Step Procedure
1. **Audit Route Middleware Chain**:
   - Inspect route declarations in `src/routes/`:
     - Are public routes limited to `/auth/signup`, `/auth/login`, `/auth/refresh`, `/groups/invite/:code/preview`, and `/integrations/google/callback`?
     - Do all protected routes mount `authenticate` and `requireGroup`?
     - Do owner routes (`DELETE /groups/:gid`, `POST /groups/:gid/invite/regenerate`) mount `requireOwner`?
2. **Verify Cross-Group Leak Prevention**:
   - Check service queries: Does every resource lookup check `resource.groupId.equals(req.groupId)`?
   - Verify that resource mismatches throw `ApiError.notFound('Resource not found')` rather than 403, preventing resource existence enumeration.
3. **Inspect Input Sanitization & MongoDB Casting**:
   - Verify all request inputs go through Zod validation.
   - Verify all incoming `:id` path parameters are validated using `mongoose.isValidObjectId(id)`.
   - Ensure object parameters are destructured rather than passed as raw objects into Mongoose `.find()` or `.updateOne()` (prevents MongoDB query selector injection).
4. **Audit Secret Hygiene & Serializers**:
   - Ensure `src/utils/serializers.js` never leaks `passwordHash`, `refreshTokenEnc`, or `tokenHash`.
   - Check Pino logger configuration in `src/config/logger.js`: Verify headers (`authorization`, `cookie`) and passwords are automatically redacted.
   - Verify Google tokens are encrypted using AES-256-GCM (`src/utils/crypto.js`).
5. **Check Rate Limits & Payloads**:
   - Verify auth routes mount `authLimiter` (10 req/min/IP).
   - Verify express body parser limits are capped at `1mb`.
6. **Apply Security Checklist**:
   - Review changes against `.agent/skills/security-review/references/security-checklist.md`.
7. **Verify Quality**:
   - Run `npm run lint` and `npm test`.

## Rules / Do-Not List
- **DO NOT return 403 on foreign group resources**: Always return 404.
- **DO NOT pass raw request bodies directly into Mongoose filters**.
- **DO NOT log authentication headers or tokens**.
- **DO NOT expose stack traces in production error responses**.

## Checklist before finishing
- [ ] Route authentication and group authorization guards confirmed.
- [ ] Cross-group access verified with 404 Not Found tests.
- [ ] MongoDB ObjectId validation verified for all `:id` parameters.
- [ ] Token encryption and hashing verified.
- [ ] `npm run lint` and `npm test` are clean.

## Example: Secure ObjectId & Cross-Group Guard
```javascript
// src/services/event.service.js
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

export async function getEventById(eventId, groupId) {
  if (!mongoose.isValidObjectId(eventId)) {
    throw ApiError.notFound('Event not found');
  }

  const event = await Event.findOne({ _id: eventId, groupId });
  if (!event) {
    // Return 404 to avoid leaking existence of events in other groups
    throw ApiError.notFound('Event not found');
  }

  return event;
}
```
