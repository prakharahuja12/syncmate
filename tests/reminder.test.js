import request from 'supertest';
import { createApp } from '../src/app.js';
import { Reminder } from '../src/models/Reminder.js';
import { processDueReminders } from '../src/jobs/reminder.job.js';

describe('Reminder Endpoints & Scheduler (Phase 5)', () => {
  const app = createApp();

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

  let owner;
  let member;
  let outsider;
  let groupId;
  let testEventId;

  beforeEach(async () => {
    owner = await createTestUser('Owner User', 'remowner@test.com');
    member = await createTestUser('Member User', 'remmember@test.com');
    outsider = await createTestUser('Outsider User', 'remoutsider@test.com');

    // Create group
    const grpRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Reminder Test Group' });
    groupId = grpRes.body.data.id;

    // Member joins group
    await request(app)
      .post('/api/v1/groups/join')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ code: grpRes.body.data.inviteCode });

    // Create a hackathon event for testing reminders
    const startAt = new Date(Date.now() + 2 * 86400000).toISOString(); // +2 days
    const endAt = new Date(Date.now() + 2 * 86400000 + 7200000).toISOString();
    const regOpens = new Date(Date.now() - 86400000).toISOString();
    const regCloses = new Date(Date.now() + 5 * 86400000).toISOString(); // +5 days

    const eventRes = await request(app)
      .post(`/api/v1/groups/${groupId}/events`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        title: 'Hackathon with Reminders',
        category: 'hackathon',
        priority: 'high',
        startAt,
        endAt,
        hackathon: {
          name: 'Reminder Hackathon',
          registrationUrl: 'https://hackathon.demo/register',
          registrationOpensAt: regOpens,
          registrationClosesAt: regCloses,
        },
      });

    testEventId = eventRes.body.data.id;
  });

  describe('GET /api/v1/events/:id/reminders', () => {
    it('returns empty reminders array initially', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${testEventId}/reminders`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('returns 404 for outsider accessing reminders of foreign group event', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${testEventId}/reminders`)
        .set('Authorization', `Bearer ${outsider.token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/events/:id/reminders', () => {
    it('sets reminders for caller and returns updated array', async () => {
      const res = await request(app)
        .put(`/api/v1/events/${testEventId}/reminders`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          reminders: [
            { anchor: 'start', offsetMinutes: 60 },
            { anchor: 'registrationClose', offsetMinutes: 1440 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].anchor).toBe('start');
      expect(res.body.data[0].offsetMinutes).toBe(60);
      expect(res.body.data[1].anchor).toBe('registrationClose');
      expect(res.body.data[1].offsetMinutes).toBe(1440);

      // Verify stored in DB
      const dbReminders = await Reminder.find({ eventId: testEventId, userId: owner.userId });
      expect(dbReminders.length).toBe(2);
    });

    it('replaces existing reminders idempotently', async () => {
      // First set 2 reminders
      await request(app)
        .put(`/api/v1/events/${testEventId}/reminders`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          reminders: [{ anchor: 'start', offsetMinutes: 60 }],
        });

      // Replace with 1 reminder
      const res = await request(app)
        .put(`/api/v1/events/${testEventId}/reminders`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          reminders: [{ anchor: 'start', offsetMinutes: 30 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].offsetMinutes).toBe(30);

      const active = await Reminder.find({
        eventId: testEventId,
        userId: owner.userId,
        status: 'pending',
      });
      expect(active.length).toBe(1);
    });

    it('rejects invalid payload with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put(`/api/v1/events/${testEventId}/reminders`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          reminders: [{ anchor: 'invalidAnchor' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when setting reminders on foreign group event', async () => {
      const res = await request(app)
        .put(`/api/v1/events/${testEventId}/reminders`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .send({
          reminders: [{ anchor: 'start', offsetMinutes: 60 }],
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Event Lifecycle Cascades', () => {
    it('cancels pending reminders when event is completed and restores on uncomplete', async () => {
      await request(app)
        .put(`/api/v1/events/${testEventId}/reminders`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          reminders: [{ anchor: 'start', offsetMinutes: 60 }],
        });

      // Complete event
      await request(app)
        .post(`/api/v1/events/${testEventId}/complete`)
        .set('Authorization', `Bearer ${owner.token}`);

      let rem = await Reminder.findOne({ eventId: testEventId, userId: owner.userId });
      expect(rem.status).toBe('cancelled');

      // Uncomplete event
      await request(app)
        .post(`/api/v1/events/${testEventId}/uncomplete`)
        .set('Authorization', `Bearer ${owner.token}`);

      rem = await Reminder.findOne({ eventId: testEventId, userId: owner.userId });
      expect(rem.status).toBe('pending');
    });

    it('recomputes fireAt when event startAt is updated', async () => {
      await request(app)
        .put(`/api/v1/events/${testEventId}/reminders`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          reminders: [{ anchor: 'start', offsetMinutes: 60 }],
        });

      const initialRem = await Reminder.findOne({ eventId: testEventId, userId: owner.userId });
      const initialFireAt = initialRem.fireAt.getTime();

      // Shift event by +1 hour
      const newStartAt = new Date(Date.now() + 3 * 86400000).toISOString();
      const newEndAt = new Date(Date.now() + 3 * 86400000 + 7200000).toISOString();

      await request(app)
        .patch(`/api/v1/events/${testEventId}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ startAt: newStartAt, endAt: newEndAt });

      const updatedRem = await Reminder.findOne({ eventId: testEventId, userId: owner.userId });
      expect(updatedRem.fireAt.getTime()).toBeGreaterThan(initialFireAt);
    });
  });

  describe('Reminder Scheduler Worker (processDueReminders)', () => {
    it('claims and delivers due reminders exactly once using injectable clock', async () => {
      // Create a reminder that should fire
      const dueTime = new Date(Date.now() + 10000);
      const reminder = await Reminder.create({
        groupId,
        eventId: testEventId,
        userId: owner.userId,
        anchor: 'start',
        offsetMinutes: 30,
        fireAt: dueTime,
        status: 'pending',
      });

      // Simulate clock after dueTime
      const fakeClock = new Date(dueTime.getTime() + 5000);
      const result = await processDueReminders(fakeClock);

      expect(result.processed).toBeGreaterThanOrEqual(1);

      const updated = await Reminder.findById(reminder._id);
      expect(updated.status).toBe('sent');
      expect(updated.sentAt).toBeDefined();

      // Second run: exactly-once delivery check
      const secondRun = await processDueReminders(fakeClock);
      expect(secondRun.processed).toBe(0);
    });

    it('silently cancels reminders older than 24 hours (stale catch-up rule)', async () => {
      const veryOldTime = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30h ago
      const staleReminder = await Reminder.create({
        groupId,
        eventId: testEventId,
        userId: owner.userId,
        anchor: 'start',
        offsetMinutes: 30,
        fireAt: veryOldTime,
        status: 'pending',
      });

      await processDueReminders(new Date());

      const updated = await Reminder.findById(staleReminder._id);
      expect(updated.status).toBe('cancelled');
    });
  });
});
