/**
 * examples/socket-test.example.js
 * Integration test verifying Socket.IO rooms, auth handshake, and base DTO broadcast.
 */
import { createServer } from 'node:http';
import { io as Client } from 'socket.io-client';
import { initSocketServer, emitToGroup } from '../../src/realtime/socket.js';

describe('Socket.IO Realtime Integration', () => {
  let ioServer, httpServer, clientA, clientB;
  const PORT = 9091;
  const testGroup = 'group-demo-123';

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = initSocketServer(httpServer);
    httpServer.listen(PORT, done);
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close(done);
  });

  beforeEach((done) => {
    // Client A in group-demo-123
    clientA = Client(`http://localhost:${PORT}`, {
      auth: { token: 'mock-valid-token-user-a' },
      transports: ['websocket']
    });

    // Client B in same group
    clientB = Client(`http://localhost:${PORT}`, {
      auth: { token: 'mock-valid-token-user-b' },
      transports: ['websocket']
    });

    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) done();
    };
    clientA.on('connect', check);
    clientB.on('connect', check);
  });

  afterEach(() => {
    clientA.disconnect();
    clientB.disconnect();
  });

  test('User B receives event:created broadcast when User A triggers mutation', (done) => {
    const eventPayload = {
      id: 'event-999',
      groupId: testGroup,
      title: 'SIH 2026 Orientation',
      category: 'hackathon',
      priority: 'high',
      startAt: '2026-11-15T09:30:00.000Z',
      endAt: '2026-11-15T11:30:00.000Z'
    };

    clientB.on('event:created', (data) => {
      expect(data.id).toBe('event-999');
      expect(data.title).toBe('SIH 2026 Orientation');
      // Verify no per-user personalized fields in group payload
      expect(data.myReminders).toBeUndefined();
      expect(data.myStatus).toBeUndefined();
      done();
    });

    // Server-side emit triggered by domain listener
    emitToGroup(testGroup, 'event:created', eventPayload);
  });
});

