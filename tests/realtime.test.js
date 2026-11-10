import http from 'node:http';
import request from 'supertest';
import { io as ioClient } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { initSocket } from '../src/realtime/socket.js';

describe('Realtime Socket.IO Integration (Phase 4)', () => {
  let server;
  let port;
  let app;
  let owner;
  let member;
  let outsider;
  let groupId;

  const createTestUser = async (name, email) => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name,
      email,
      password: 'Password123!',
    });
    return {
      token: res.body.data.accessToken,
      userId: res.body.data.user.id,
      user: res.body.data.user,
    };
  };

  beforeAll((done) => {
    app = createApp();
    server = http.createServer(app);
    initSocket(server);
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(async () => {
    owner = await createTestUser('Socket Owner', 'socketowner@test.com');
    member = await createTestUser('Socket Member', 'socketmember@test.com');
    outsider = await createTestUser('Socket Outsider', 'socketoutsider@test.com');

    // Owner creates group
    const grpRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Socket Realtime Group' });
    groupId = grpRes.body.data.id;

    // Member joins group
    await request(app)
      .post('/api/v1/groups/join')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ code: grpRes.body.data.inviteCode });
  });

  describe('Authentication Handshake & Heartbeat', () => {
    it('rejects connection without token with UNAUTHORIZED', (done) => {
      const socket = ioClient(`http://localhost:${port}`, {
        transports: ['websocket'],
        reconnection: false,
      });

      socket.on('connect_error', (err) => {
        expect(err.message).toMatch(/UNAUTHORIZED/);
        socket.disconnect();
        done();
      });
    });

    it('rejects connection with invalid token with UNAUTHORIZED', (done) => {
      const socket = ioClient(`http://localhost:${port}`, {
        auth: { token: 'invalid_expired_token' },
        transports: ['websocket'],
        reconnection: false,
      });

      socket.on('connect_error', (err) => {
        expect(err.message).toMatch(/UNAUTHORIZED/);
        socket.disconnect();
        done();
      });
    });

    it('successfully connects with valid JWT and responds to heartbeat ping ack', (done) => {
      const socket = ioClient(`http://localhost:${port}`, {
        auth: { token: member.token },
        transports: ['websocket'],
        reconnection: false,
      });

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);

        socket.emit('ping', (ack) => {
          expect(ack.pong).toBe(true);
          expect(typeof ack.timestamp).toBe('number');
          socket.disconnect();
          done();
        });
      });
    });
  });

  describe('Realtime Domain Event Broadcasting', () => {
    let memberSocket;
    let outsiderSocket;

    beforeEach((done) => {
      let connectedCount = 0;
      const checkDone = () => {
        connectedCount++;
        if (connectedCount === 2) done();
      };

      memberSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: member.token },
        transports: ['websocket'],
        reconnection: false,
      });
      memberSocket.on('connect', checkDone);

      outsiderSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: outsider.token },
        transports: ['websocket'],
        reconnection: false,
      });
      outsiderSocket.on('connect', checkDone);
    });

    afterEach(() => {
      if (memberSocket && memberSocket.connected) memberSocket.disconnect();
      if (outsiderSocket && outsiderSocket.connected) outsiderSocket.disconnect();
    });

    it('broadcasts event:created to group members and NOT to outsiders', (done) => {
      let outsiderHeard = false;
      outsiderSocket.on('event:created', () => {
        outsiderHeard = true;
      });

      memberSocket.on('event:created', (payload) => {
        expect(payload).toBeDefined();
        expect(payload.title).toBe('Realtime Hackathon');
        expect(payload.category).toBe('hackathon');
        expect(payload.primaryUrl).toBeDefined();

        setTimeout(() => {
          expect(outsiderHeard).toBe(false);
          done();
        }, 150);
      });

      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now() + 90000000).toISOString();

      request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Realtime Hackathon',
          category: 'hackathon',
          priority: 'high',
          startAt,
          endAt,
          allDay: false,
          assignedToAll: true,
          hackathon: {
            name: 'Realtime Hackathon',
            registrationUrl: 'https://realtime.example.com/register',
          },
        })
        .then((res) => {
          expect(res.status).toBe(201);
        });
    });

    it('broadcasts event:updated when an event is modified', (done) => {
      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now() + 90000000).toISOString();

      request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Pre-Update Event',
          category: 'other',
          priority: 'low',
          startAt,
          endAt,
          allDay: false,
          assignedToAll: true,
        })
        .then((createRes) => {
          expect(createRes.status).toBe(201);
          const eventId = createRes.body.data.id;

          memberSocket.on('event:updated', (payload) => {
            expect(payload.id).toBe(eventId);
            expect(payload.title).toBe('Post-Update Event');
            expect(payload.priority).toBe('high');
            done();
          });

          // Update event
          request(app)
            .patch(`/api/v1/events/${eventId}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({
              title: 'Post-Update Event',
              priority: 'high',
            })
            .then((updateRes) => {
              expect(updateRes.status).toBe(200);
            });
        });
    });

    it('broadcasts event:completed when an event is marked completed', (done) => {
      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now() + 90000000).toISOString();

      request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Event To Complete',
          category: 'meeting',
          priority: 'medium',
          startAt,
          endAt,
          allDay: false,
          assignedToAll: true,
        })
        .then((createRes) => {
          expect(createRes.status).toBe(201);
          const eventId = createRes.body.data.id;

          memberSocket.on('event:completed', (payload) => {
            expect(payload.id).toBe(eventId);
            expect(payload.status).toBe('completed');
            done();
          });

          request(app)
            .post(`/api/v1/events/${eventId}/complete`)
            .set('Authorization', `Bearer ${owner.token}`)
            .then((res) => {
              expect(res.status).toBe(200);
            });
        });
    });

    it('broadcasts event:deleted with { id } when an event is deleted', (done) => {
      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now() + 90000000).toISOString();

      request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Event To Delete',
          category: 'personal',
          priority: 'low',
          startAt,
          endAt,
          allDay: false,
          assignedToAll: true,
        })
        .then((createRes) => {
          const eventId = createRes.body.data.id;

          memberSocket.on('event:deleted', (payload) => {
            expect(payload.id).toBe(eventId);
            done();
          });

          request(app)
            .delete(`/api/v1/events/${eventId}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .then((res) => {
              expect(res.status).toBe(200);
            });
        });
    });
  });
});
