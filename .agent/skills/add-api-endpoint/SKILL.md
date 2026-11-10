---
name: add-api-endpoint
description: Implements new backend REST endpoints following the strict route -> validator (zod) -> controller -> service -> serializer -> test pipeline with standard envelopes and group authorization. Trigger on "add endpoint", "new route", "create API", "implement route", or "POST / PATCH / GET / DELETE endpoint".
---

# Add API Endpoint (SyncMate Backend)

## Purpose
Guides the end-to-end creation of a SyncMate API endpoint following strict architectural principles: thin controllers, fat services, Zod validation, group authorization, standardized envelopes, decoupled domain events, and comprehensive integration testing.

## When to use
- Implementing any new REST endpoint defined in `docs/API_CONTRACT.md`.
- Refactoring or expanding existing controllers and services.
- Triggers: "add endpoint", "new route", "create API", "implement route", "new endpoint".

## Step-by-step procedure
1. **Verify Contract Specification**:
   - Check `docs/API_CONTRACT.md` for exact path, HTTP verb, query params, request body, status code, and response envelope.
2. **Define Zod Validator** (`src/validators/<module>.validator.js`):
   - Define schema with `.strict()` to strip and reject unknown properties.
   - Enforce enum constraints (`priority`, `category`, `status`, etc.).
   - Reject empty strings on required text fields with `.trim().min(1)`.
3. **Mount Route with Middlewares** (`src/routes/<module>.routes.js`):
   - Order: `authenticate` -> `requireGroup` (or `requireOwner`) -> `validate(schema)` -> `asyncHandler(controller.fn)`.
   - Ensure the route file is registered in `src/routes/index.js` under `/api/v1`.
4. **Implement Thin Controller** (`src/controllers/<module>.controller.js`):
   - Extract parameters (`req.params`, `req.query`, `req.body`, `req.user.id`, `req.groupId`).
   - Call the corresponding service method.
   - Serialize the result with `src/utils/serializers.js`.
   - Return response using `sendSuccess(res, data, statusCode, meta)`.
5. **Implement Fat Service** (`src/services/<module>.service.js`):
   - Execute all DB queries inside the service or model repository.
   - **Cross-group protection**: Verify `resource.groupId.equals(groupId)`. If mismatched or missing, throw `ApiError.notFound('Resource not found')` to avoid leaking resource existence.
   - Execute business mutations and save to MongoDB.
   - Emit a decoupled domain event via `eventBus.emit('domain.<entity>.<action>', payload)` so listeners handle notifications, sockets, and Google sync.
6. **Write Integration Test** (`tests/integration/<module>.test.js`):
   - Test happy path (200/201).
   - Test cross-group isolation (user in Group B receives 404 when querying Group A's resource).
   - Test validation errors (400 `VALIDATION_ERROR`).
7. **Verify Quality**:
   - Run `npm run lint` and `npm test tests/integration/<module>.test.js`.

## Rules / Do-Not List
- **DO NOT put business logic or DB calls in controllers**: Controllers only parse inputs, call services, and serialize outputs.
- **DO NOT leak MongoDB IDs or internals**: Always map `_id` to `id` in serializers.
- **DO NOT pass raw `req.body` to Mongoose queries**: Always use validated, sanitized data.
- **DO NOT return 403 on cross-group access**: Return 404 to avoid leaking the existence of resources in other groups.
- **DO NOT emit socket events or dispatch push directly from controllers**: Emit domain events via `eventBus` so listeners handle side-effects asynchronously.

## Checklist before finishing
- [ ] Endpoint path, method, and status codes match `docs/API_CONTRACT.md`.
- [ ] Zod schema strips unknown keys and validates types.
- [ ] `requireGroup` / `requireOwner` middleware attached.
- [ ] Cross-group access verified with 404 test.
- [ ] Response wrapped in `{ success: true, data }`.
- [ ] `npm run lint` is clean.
- [ ] `npm test` passes for the new endpoint.

## Example: Event Complete Endpoint
```javascript
// src/controllers/event.controller.js
export async function completeEvent(req, res) {
  const event = await eventService.setEventCompletion({
    eventId: req.params.id,
    groupId: req.groupId,
    userId: req.user.id,
    isCompleted: true
  });
  return sendSuccess(res, serializeEvent(event, req.user.id));
}

// src/services/event.service.js
export async function setEventCompletion({ eventId, groupId, userId, isCompleted }) {
  const event = await Event.findOne({ _id: eventId, groupId });
  if (!event) throw ApiError.notFound('Event not found');

  event.status = isCompleted ? 'completed' : 'pending';
  event.completedAt = isCompleted ? new Date() : null;
  event.completedBy = isCompleted ? userId : null;
  event.updatedBy = userId;
  await event.save();

  eventBus.emit(isCompleted ? 'domain.event.completed' : 'domain.event.uncompleted', {
    event,
    actorId: userId,
    groupId
  });
  return event;
}
```

