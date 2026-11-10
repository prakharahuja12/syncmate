---
name: backend-test-writer
description: Generates integration and unit test suites using Jest, Supertest, mongodb-memory-server, fake timers, and socket.io-client. Trigger on "write test", "integration test", "jest test", "test suite", or "unit test".
---

# Backend Test Writer (SyncMate Backend)

## Purpose
Establishes standardized testing patterns across the backend using Jest, Supertest, `mongodb-memory-server`, and fake timers, ensuring 100% hermetic tests that verify happy paths, validation errors, and cross-group authorization leaks.

## When to use
- Writing new integration tests in `tests/` for routes, services, or jobs.
- Testing Socket.IO connections and room broadcasts.
- Verifying reminder schedules with injectable fake clocks.
- Triggers: "write test", "integration test", "jest test", "test suite", "unit test".

## Step-by-Step Procedure
1. **Initialize In-Memory MongoDB Fixture**:
   - Verify `tests/setup.js` initializes `MongoMemoryServer` and cleans collections in `afterEach`.
   - Never run tests against real production or local development databases.
2. **Structure Supertest Suite**:
   - For every endpoint, test:
     1. **Happy Path**: Correct status code (`200` or `201`), envelope `{ success: true, data }`.
     2. **Validation Failure**: Invalid payload triggers `400` with code `VALIDATION_ERROR` and detailed error paths.
     3. **Cross-Group Isolation**: User from Group B queries or modifies Group A's resource -> assert `404` (not `403` to prevent existence leakage).
     4. **Unauthorized Access**: Missing or expired token triggers `401` `UNAUTHORIZED`.
3. **Mock Third-Party Services**:
   - Mock Firebase Admin (`firebase-admin`): avoid real network push notifications.
   - Mock Nodemailer (`nodemailer`): verify email templates in memory.
   - Mock Google APIs (`googleapis`): test OAuth token exchange and event inserts hermetically.
4. **Test Realtime Sockets with `socket.io-client`**:
   - Connect client with valid JWT in handshake auth.
   - Trigger REST mutation and assert client receives broadcast within 1 second.
   - Assert client in another group receives zero emissions.
5. **Test Jobs with Fake Clocks**:
   - Pass fake dates or use `jest.useFakeTimers()` to advance time past `fireAt`.
   - Verify cron tasks claim and process exactly once.
6. **Execute & Report**:
   - Run `npm test <test-file>` and ensure coverage targets (>=80% services).

## Rules / Do-Not List
- **DO NOT make external network calls** during tests: mock all APIs.
- **DO NOT share database state across tests**: always clear in `afterEach`.
- **DO NOT omit cross-group isolation tests**: every group-scoped route must verify 404 on cross-group access.

## Checklist before finishing
- [ ] Happy path (200/201), validation (400), and auth (401) tested.
- [ ] Cross-group access verified with 404 test case.
- [ ] External SDKs (FCM, Nodemailer, Google) mocked cleanly.
- [ ] All tests pass: `npm test`.
- [ ] Linter is clean: `npm run lint`.

## Example: Cross-Group Isolation Test
```javascript
test('404: cross-group data leakage prevented', async () => {
  const res = await request(app)
    .get(`/api/v1/events/${eventGroupA._id}`)
    .set('Authorization', `Bearer ${tokenUserGroupB}`);

  expect(res.status).toBe(404);
  expect(res.body.success).toBe(false);
  expect(res.body.error.code).toBe('NOT_FOUND');
});
```
