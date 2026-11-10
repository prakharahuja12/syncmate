---
name: contract-guard
description: Verifies backend routes, request/response fields, enums, error codes, and Socket.IO events against API_CONTRACT.md before and after changes. Trigger on "modify API", "new endpoint", "check contract", "verify route", or "change schema".
---

# Contract Guard (SyncMate Backend)

## Purpose
Ensures that all backend endpoints, request payloads, response envelopes, error codes, and Socket.IO events strictly adhere to `docs/API_CONTRACT.md` without drift.

## When to use
- Before writing or altering any route, controller, validator, or serializer.
- After implementing an endpoint to verify that field names and response shapes match `API_CONTRACT.md`.
- When adding or modifying Socket.IO event payloads.
- Triggers: "modify API", "add endpoint", "check contract", "verify route", "change schema", "socket event".

## Step-by-Step Procedure
1. **Pre-flight Contract Verification**:
   - Open `docs/API_CONTRACT.md`.
   - Identify the exact HTTP method, path, required headers, query parameters, and JSON payload.
   - Note required error codes and response envelopes.
2. **Schema & Validator Alignment**:
   - Verify that the Zod schema in `src/validators/` strips unknown keys (`.strict()` or default zod behavior) and enforces types defined in the contract.
   - Enforce enum fields strictly:
     - `category`: `hackathon | college | personal | meeting | competition | other`
     - `priority`: `high | medium | low`
     - `status`: `pending | completed`
     - `participation.status`: `interested | planning | registered | not_interested`
3. **Response Envelope & Serialization**:
   - Ensure success responses wrap data: `{ success: true, data: { ... } }`.
   - Ensure error responses produce: `{ success: false, error: { code, message, details } }`.
   - Verify `src/utils/serializers.js` transforms `_id` to `id` and computes virtual fields like `primaryUrl` for hackathon events.
4. **Socket.IO Event Payloads**:
   - Verify payload shapes for emitted domain events match the contract (e.g. `event:deleted` sends `{ id }`, `pin:changed` sends `{ eventId, pinSummary }`).
5. **Run Route Diff Script**:
   - Execute the contract check script:
     ```bash
     node .agent/skills/contract-guard/scripts/diff-contract.js
     ```
6. **Lint & Test Verification**:
   - Run `npm run lint` and `npm test` to confirm no type or route regressions exist.

## Rules / Do-Not List
- **DO NOT rename contract fields** (e.g. do not rename `startAt` to `startDate` or `primaryUrl` to `mainUrl`).
- **DO NOT leak MongoDB internals** (`_id`, `__v`, `passwordHash`, `refreshTokenEnc`).
- **DO NOT use custom status codes or envelopes**: use only the 10 defined error codes.
- **DO NOT permit mutations over Socket.IO**: all mutations must go through REST.

## Checklist Before Finishing
- [ ] Route path and HTTP method match `API_CONTRACT.md`.
- [ ] Query and body params validated via Zod.
- [ ] Response wrapped in standard `{ success, data }` or `{ success, error }`.
- [ ] All dates are ISO-8601 UTC strings.
- [ ] Route diff script passes with zero discrepancies.
- [ ] `npm run lint` and `npm test` execute cleanly.

## Example: Event Serialization Guard
```javascript
// src/utils/serializers.js
export function serializeEvent(eventDoc, myUserId = null) {
  const event = eventDoc.toObject ? eventDoc.toObject() : { ...eventDoc };
  const primaryUrl = event.hackathon?.registrationUrl || event.hackathon?.officialUrl || event.url || null;

  return {
    id: event._id.toString(),
    groupId: event.groupId.toString(),
    kind: event.kind,
    title: event.title,
    description: event.description,
    category: event.category,
    priority: event.priority,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    allDay: Boolean(event.allDay),
    url: event.url || null,
    primaryUrl,
    assignedToAll: event.assignedToAll,
    assignedTo: (event.assignedTo || []).map(id => id.toString()),
    status: event.status,
    completedAt: event.completedAt?.toISOString() || null,
    completedBy: event.completedBy ? event.completedBy.toString() : null,
    createdBy: event.createdBy,
    updatedBy: event.updatedBy,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    hackathon: event.hackathon || undefined,
    isUrgent: event.isUrgent
  };
}
```

