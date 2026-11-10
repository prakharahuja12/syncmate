# SyncMate API Contract Summary Reference

## Response Envelope
```json
// Success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 57 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

## Standard Error Codes & Status Codes
- `VALIDATION_ERROR`: 400
- `UNAUTHORIZED`: 401
- `TOKEN_EXPIRED`: 401
- `FORBIDDEN`: 403
- `NOT_FOUND`: 404
- `CONFLICT`: 409
- `GROUP_FULL`: 409
- `INVITE_INVALID`: 410
- `RATE_LIMITED`: 429
- `INTERNAL`: 500

## Socket.IO Events
- Server -> Client: `event:created`, `event:updated`, `event:deleted`, `event:completed`, `pin:changed`, `status:changed`, `notification:new`, `group:member-joined`, `group:member-left`, `group:deleted`, `activity:new`
- Client -> Server: `ping` only. All mutations use REST.

