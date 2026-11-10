import request from 'supertest';
import { createApp } from '../src/app.js';
import { Pin } from '../src/models/Pin.js';
import { Participation } from '../src/models/Participation.js';
import { Reminder } from '../src/models/Reminder.js';
import { Notification } from '../src/models/Notification.js';

describe('Watchlist & Participation Endpoints (Phase 6)', () => {
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
  let testHackathonEventId;

  beforeEach(async () => {
    owner = await createTestUser('Alice Owner', 'alice@test.com');
    member = await createTestUser('Bob Member', 'bob@test.com');
    outsider = await createTestUser('Charlie Outsider', 'charlie@test.com');

    // Create group
    const grpRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Watchlist Group' });
    groupId = grpRes.body.data.id;

    // Member joins group
    await request(app)
      .post('/api/v1/groups/join')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ code: grpRes.body.data.inviteCode });

    // Standard event
    const stdRes = await request(app)
      .post(`/api/v1/groups/${groupId}/events`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        title: 'Regular Meeting',
        category: 'meeting',
        priority: 'medium',
        startAt: new Date(Date.now() + 86400000).toISOString(),
        endAt: new Date(Date.now() + 90000000).toISOString(),
      });
    testEventId = stdRes.body.data.id;

    // Hackathon event with future registration deadline
    const hackRes = await request(app)
      .post(`/api/v1/groups/${groupId}/events`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        title: 'Smart India Hackathon 2026',
        category: 'hackathon',
        priority: 'high',
        startAt: new Date(Date.now() + 10 * 86400000).toISOString(),
        endAt: new Date(Date.now() + 12 * 86400000).toISOString(),
        hackathon: {
          name: 'SIH 2026',
          registrationUrl: 'https://sih.gov.in/register',
          registrationOpensAt: new Date(Date.now() - 86400000).toISOString(),
          registrationClosesAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        },
      });
    testHackathonEventId = hackRes.body.data.id;
  });

  describe('POST /api/v1/events/:id/pin', () => {
    it('pins an event with default group visibility and auto-sets status to interested', async () => {
      const res = await request(app)
        .post(`/api/v1/events/${testEventId}/pin`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isPinnedByMe).toBe(true);
      expect(res.body.data.pinnedBy).toHaveLength(1);
      expect(res.body.data.pinnedBy[0].user.id).toBe(member.userId);
      expect(res.body.data.pinnedBy[0].visibility).toBe('group');

      // Auto-set participation to interested
      const part = await Participation.findOne({ eventId: testEventId, userId: member.userId });
      expect(part).not.toBeNull();
      expect(part.status).toBe('interested');
    });

    it('auto-creates default 3d and 1d registration deadline reminders on save', async () => {
      const res = await request(app)
        .post(`/api/v1/events/${testHackathonEventId}/pin`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ visibility: 'group' });

      expect(res.status).toBe(200);

      const reminders = await Reminder.find({
        eventId: testHackathonEventId,
        userId: member.userId,
        anchor: 'registrationClose',
      });

      expect(reminders.length).toBe(2);
      const offsets = reminders.map((r) => r.offsetMinutes).sort((a, b) => a - b);
      expect(offsets).toEqual([1440, 4320]);
    });

    it('hides private pin from other members pinSummary', async () => {
      // Bob pins privately
      const pinRes = await request(app)
        .post(`/api/v1/events/${testEventId}/pin`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ visibility: 'private' });

      expect(pinRes.status).toBe(200);
      expect(pinRes.body.data.isPinnedByMe).toBe(true);

      // Alice inspects the event
      const aliceRes = await request(app)
        .get(`/api/v1/events/${testEventId}`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(aliceRes.status).toBe(200);
      expect(aliceRes.body.data.pinSummary.isPinnedByMe).toBe(false);
      expect(aliceRes.body.data.pinSummary.pinnedBy).toHaveLength(0);
    });

    it('returns 404 when outsider attempts to pin event', async () => {
      const res = await request(app)
        .post(`/api/v1/events/${testEventId}/pin`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/events/:id/pin', () => {
    it('unpins event and leaves other members pins intact', async () => {
      // Both Alice and Bob pin the event
      await request(app)
        .post(`/api/v1/events/${testEventId}/pin`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({});
      await request(app)
        .post(`/api/v1/events/${testEventId}/pin`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({});

      // Bob unpins
      const res = await request(app)
        .delete(`/api/v1/events/${testEventId}/pin`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pinSummary.isPinnedByMe).toBe(false);

      // Alice's pin is still there
      const pinInDb = await Pin.findOne({ eventId: testEventId, userId: owner.userId });
      expect(pinInDb).not.toBeNull();
    });

    it('returns 404 for outsider', async () => {
      const res = await request(app)
        .delete(`/api/v1/events/${testEventId}/pin`)
        .set('Authorization', `Bearer ${outsider.token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/events/:id/my-status', () => {
    it('updates status and cancels registration reminders when registered', async () => {
      // Pin hackathon first to auto-generate reminders
      await request(app)
        .post(`/api/v1/events/${testHackathonEventId}/pin`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({});

      const remindersBefore = await Reminder.find({
        eventId: testHackathonEventId,
        userId: member.userId,
        status: 'pending',
      });
      expect(remindersBefore.length).toBeGreaterThan(0);

      // Change status to registered
      const res = await request(app)
        .put(`/api/v1/events/${testHackathonEventId}/my-status`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ status: 'registered' });

      expect(res.status).toBe(200);
      expect(res.body.data.myStatus).toBe('registered');

      // Pending registrationClose reminders are cancelled
      const activeRegReminders = await Reminder.find({
        eventId: testHackathonEventId,
        userId: member.userId,
        anchor: 'registrationClose',
        status: 'pending',
      });
      expect(activeRegReminders).toHaveLength(0);

      // Notification generated for group members
      const notifs = await Notification.find({
        groupId,
        type: 'status_changed',
      });
      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs[0].body).toContain('registered for');
    });

    it('rejects invalid status enum with 400', async () => {
      const res = await request(app)
        .put(`/api/v1/events/${testEventId}/my-status`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ status: 'attending' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/events/:id/participation', () => {
    it('returns status for all group members with null for non-responders', async () => {
      // Member sets status to planning
      await request(app)
        .put(`/api/v1/events/${testEventId}/my-status`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ status: 'planning' });

      const res = await request(app)
        .get(`/api/v1/events/${testEventId}/participation`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);

      const bobEntry = res.body.data.find((p) => p.user.id === member.userId);
      const aliceEntry = res.body.data.find((p) => p.user.id === owner.userId);

      expect(bobEntry.status).toBe('planning');
      expect(aliceEntry.status).toBeNull();
    });
  });

  describe('GET /api/v1/groups/:gid/watchlist', () => {
    it('returns partitioned { open, closed } watchlist with daysToRegistrationClose', async () => {
      // Pin both events
      await request(app)
        .post(`/api/v1/events/${testEventId}/pin`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({});
      await request(app)
        .post(`/api/v1/events/${testHackathonEventId}/pin`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({});

      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/watchlist`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('open');
      expect(res.body.data).toHaveProperty('closed');
      expect(Array.isArray(res.body.data.open)).toBe(true);
      expect(res.body.data.open.length).toBe(2);

      const hackItem = res.body.data.open.find((i) => i.id === testHackathonEventId);
      expect(hackItem).toBeDefined();
      expect(typeof hackItem.daysToRegistrationClose).toBe('number');
      expect(hackItem.daysToRegistrationClose).toBeGreaterThan(0);
      expect(hackItem).toHaveProperty('pinSummary');
      expect(hackItem).toHaveProperty('participation');
    });

    it('respects scope=mine filter', async () => {
      // Owner pins testEventId
      await request(app)
        .post(`/api/v1/events/${testEventId}/pin`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({});

      // Member queries scope=mine (empty for Bob)
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/watchlist?scope=mine`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.open).toHaveLength(0);
    });

    it('returns 404 for outsider accessing group watchlist', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/watchlist`)
        .set('Authorization', `Bearer ${outsider.token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Event Deletion Cascade', () => {
    it('deletes pins and participations when event is deleted', async () => {
      await request(app)
        .post(`/api/v1/events/${testEventId}/pin`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({});

      await request(app)
        .put(`/api/v1/events/${testEventId}/my-status`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ status: 'interested' });

      // Owner deletes event
      const delRes = await request(app)
        .delete(`/api/v1/events/${testEventId}`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(delRes.status).toBe(200);

      const pins = await Pin.find({ eventId: testEventId });
      const parts = await Participation.find({ eventId: testEventId });

      expect(pins).toHaveLength(0);
      expect(parts).toHaveLength(0);
    });
  });
});
