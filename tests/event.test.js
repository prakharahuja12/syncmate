import request from 'supertest';
import { createApp } from '../src/app.js';
import { Activity } from '../src/models/Activity.js';
import { Reminder } from '../src/models/Reminder.js';

describe('Event Endpoints & Workflows (Phase 3)', () => {
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

  beforeEach(async () => {
    owner = await createTestUser('Owner User', 'eventowner@test.com');
    member = await createTestUser('Member User', 'eventmember@test.com');
    outsider = await createTestUser('Outsider User', 'eventoutsider@test.com');

    // Owner creates group
    const grpRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Event Test Group' });
    groupId = grpRes.body.data.id;

    // Member joins
    await request(app)
      .post('/api/v1/groups/join')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ code: grpRes.body.data.inviteCode });
  });

  describe('POST /api/v1/groups/:gid/events (Create Event)', () => {
    it('successfully creates standard event with valid fields', async () => {
      const startAt = new Date(Date.now() + 86400000).toISOString(); // +1 day
      const endAt = new Date(Date.now() + 90000000).toISOString();

      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Sprint Planning',
          description: 'Weekly team sprint planning',
          category: 'meeting',
          priority: 'high',
          startAt,
          endAt,
          url: 'https://meet.google.com/abc-xyz',
          assignedToAll: true,
          reminders: [{ anchor: 'start', offsetMinutes: 60 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Sprint Planning');
      expect(res.body.data.category).toBe('meeting');
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.primaryUrl).toBe('https://meet.google.com/abc-xyz');
      expect(res.body.data.createdBy.id).toBe(owner.userId);
      expect(res.body.data.status).toBe('pending');

      // Verify reminder created
      const rem = await Reminder.findOne({ eventId: res.body.data.id, userId: owner.userId });
      expect(rem).toBeDefined();
      expect(rem.anchor).toBe('start');
      expect(rem.offsetMinutes).toBe(60);

      // Verify activity created
      const act = await Activity.findOne({ eventId: res.body.data.id, action: 'event.created' });
      expect(act).toBeDefined();
      expect(act.summary).toContain('added Sprint Planning');
    });

    it('creates hackathon event with rich metadata and primaryUrl resolution', async () => {
      const startAt = new Date(Date.now() + 86400000 * 5).toISOString();
      const endAt = new Date(Date.now() + 86400000 * 7).toISOString();
      const regOpens = new Date(Date.now() + 86400000).toISOString();
      const regCloses = new Date(Date.now() + 86400000 * 3).toISOString();

      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          title: 'SIH 2026',
          category: 'hackathon',
          priority: 'high',
          startAt,
          endAt,
          hackathon: {
            name: 'Smart India Hackathon',
            registrationUrl: 'https://sih.gov.in/register',
            officialUrl: 'https://sih.gov.in',
            registrationOpensAt: regOpens,
            registrationClosesAt: regCloses,
            prizePool: '₹1,00,000',
            location: 'New Delhi',
            mode: 'offline',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('SIH 2026');
      expect(res.body.data.hackathon.name).toBe('Smart India Hackathon');
      expect(res.body.data.primaryUrl).toBe('https://sih.gov.in/register'); // registrationUrl takes precedence
    });

    it('rejects event when endAt < startAt with 400 VALIDATION_ERROR', async () => {
      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now()).toISOString(); // before startAt

      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Invalid Date Event',
          category: 'other',
          startAt,
          endAt,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects hackathon category without hackathon.name with 400 VALIDATION_ERROR', async () => {
      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now() + 90000000).toISOString();

      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Missing Hackathon Name',
          category: 'hackathon',
          startAt,
          endAt,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects request from outsider not in the group with 404 NOT_FOUND', async () => {
      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now() + 90000000).toISOString();

      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .send({
          title: 'Outsider Event',
          category: 'other',
          startAt,
          endAt,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/groups/:gid/events (List Events)', () => {
    let event1;
    let event2;
    let event3;

    beforeEach(async () => {
      const now = Date.now();

      // High priority event starting in 10 hours (urgent)
      const res1 = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Urgent High Priority Event',
          category: 'college',
          priority: 'high',
          startAt: new Date(now + 10 * 3600000).toISOString(),
          endAt: new Date(now + 12 * 3600000).toISOString(),
        });
      event1 = res1.body.data;

      // Medium priority event starting in 5 days
      const res2 = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Medium College Meetup',
          category: 'college',
          priority: 'medium',
          startAt: new Date(now + 5 * 86400000).toISOString(),
          endAt: new Date(now + 5 * 86400000 + 3600000).toISOString(),
        });
      event2 = res2.body.data;

      // Hackathon with registration closing in 2 days
      const res3 = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'DevFest 2026',
          category: 'hackathon',
          priority: 'low',
          startAt: new Date(now + 10 * 86400000).toISOString(),
          endAt: new Date(now + 12 * 86400000).toISOString(),
          hackathon: {
            name: 'DevFest',
            registrationOpensAt: new Date(now - 86400000).toISOString(),
            registrationClosesAt: new Date(now + 2 * 86400000).toISOString(),
          },
        });
      event3 = res3.body.data;
    });

    it('lists all events for the group', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('computes isUrgent correctly', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${member.token}`);

      const urgentEvent = res.body.data.find((e) => e.id === event1.id);
      expect(urgentEvent.isUrgent).toBe(true);

      const nonUrgent = res.body.data.find((e) => e.id === event2.id);
      expect(nonUrgent.isUrgent).toBe(false);
    });

    it('sorts by priority correctly (high < medium < low)', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/events?sort=priority&order=asc`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].id).toBe(event1.id); // high
      expect(res.body.data[1].id).toBe(event2.id); // medium
      expect(res.body.data[2].id).toBe(event3.id); // low
    });

    it('filters by category', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/events?category=hackathon`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(event3.id);
    });

    it('applies calendar range overlap query and returns calendarMarkers for reg-close', async () => {
      const now = Date.now();
      const from = new Date(now).toISOString();
      const to = new Date(now + 3 * 86400000).toISOString(); // next 3 days

      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/events?from=${from}&to=${to}`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);

      // Event 1 (in 10h) and Event 3 (reg closes in 2 days) should be returned
      const returnedIds = res.body.data.map((e) => e.id);
      expect(returnedIds).toContain(event1.id);
      expect(returnedIds).toContain(event3.id);

      // Event 3 should have calendarMarker for registrationClose
      const hackathonItem = res.body.data.find((e) => e.id === event3.id);
      expect(hackathonItem.calendarMarkers).toBeDefined();
      expect(hackathonItem.calendarMarkers[0].type).toBe('registrationClose');
    });
  });

  describe('GET, PATCH, DELETE /api/v1/events/:id', () => {
    let eventId;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          title: 'Member Created Task',
          category: 'personal',
          kind: 'task',
          priority: 'medium',
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 90000000).toISOString(),
        });
      eventId = res.body.data.id;
    });

    it('allows any group member to read event by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(eventId);
    });

    it('rejects read from outsider with 404 NOT_FOUND', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${outsider.token}`);

      expect(res.status).toBe(404);
    });

    it('allows any group member to update event and updates activity log', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Renamed Task by Owner',
          priority: 'high',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Renamed Task by Owner');
      expect(res.body.data.priority).toBe('high');

      const act = await Activity.findOne({ eventId, action: 'event.updated' });
      expect(act).toBeDefined();
      expect(act.summary).toContain('updated Renamed Task by Owner');
    });

    it('allows creator to delete event', async () => {
      const res = await request(app)
        .delete(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request(app)
        .get(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${owner.token}`);
      expect(check.status).toBe(404);
    });

    it('allows group owner to delete event created by another member', async () => {
      const res = await request(app)
        .delete(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
    });

    it('rejects delete from non-creator non-owner member with 403 FORBIDDEN', async () => {
      // Add third member
      const third = await createTestUser('Third Member', 'third@test.com');
      const grp = await request(app)
        .get('/api/v1/groups/me')
        .set('Authorization', `Bearer ${owner.token}`);
      await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${third.token}`)
        .send({ code: grp.body.data.inviteCode });

      // Third member tries to delete member's event
      const res = await request(app)
        .delete(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${third.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/v1/events/:id/complete and /uncomplete', () => {
    let eventId;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Completion Test Event',
          category: 'other',
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 90000000).toISOString(),
          reminders: [{ anchor: 'start', offsetMinutes: 30 }],
        });
      eventId = res.body.data.id;
    });

    it('completes event and cancels pending reminders', async () => {
      const res = await request(app)
        .post(`/api/v1/events/${eventId}/complete`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.completedAt).toBeDefined();
      expect(res.body.data.completedBy).toBe(member.userId);
      expect(res.body.data.isUrgent).toBe(false); // Completed events are NEVER urgent

      // Verify reminder cancelled
      const rem = await Reminder.findOne({ eventId });
      expect(rem.status).toBe('cancelled');

      // Verify activity created
      const act = await Activity.findOne({ eventId, action: 'event.completed' });
      expect(act).toBeDefined();
    });

    it('uncompletes event and restores status to pending', async () => {
      // First complete
      await request(app)
        .post(`/api/v1/events/${eventId}/complete`)
        .set('Authorization', `Bearer ${owner.token}`);

      // Now uncomplete
      const res = await request(app)
        .post(`/api/v1/events/${eventId}/uncomplete`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.completedAt).toBeNull();

      // Verify reminder restored
      const rem = await Reminder.findOne({ eventId });
      expect(rem.status).toBe('pending');
    });
  });
});
