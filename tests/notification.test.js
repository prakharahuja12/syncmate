import request from 'supertest';
import { createApp } from '../src/app.js';
import { Notification } from '../src/models/Notification.js';

describe('Notification Endpoints & Integration (Phase 4)', () => {
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
    owner = await createTestUser('Owner User', 'notifowner@test.com');
    member = await createTestUser('Member User', 'notifmember@test.com');
    outsider = await createTestUser('Outsider User', 'notifoutsider@test.com');

    // Owner creates group
    const grpRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Notification Group' });
    groupId = grpRes.body.data.id;

    // Member joins group
    await request(app)
      .post('/api/v1/groups/join')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ code: grpRes.body.data.inviteCode });

    // Clear notifications generated during setup (e.g. member_joined) so tests start clean
    await Notification.deleteMany({});
  });

  describe('REST Endpoints (/api/v1/notifications)', () => {
    it('GET /api/v1/notifications requires authentication', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/notifications returns empty list for new user', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 20,
        total: 0,
      });
    });

    it('creates and lists notifications with unread filter and pagination', async () => {
      // Seed two notifications directly for testing endpoints
      const n1 = await Notification.create({
        userId: member.userId,
        groupId,
        actorId: owner.userId,
        type: 'event_created',
        title: 'New Event Test',
        body: 'Owner added a test event',
        readAt: null,
      });

      const _n2 = await Notification.create({
        userId: member.userId,
        groupId,
        actorId: owner.userId,
        type: 'event_updated',
        title: 'Updated Event Test',
        body: 'Owner updated a test event',
        readAt: new Date(),
      });

      // Also create a notification for another user to verify isolation
      await Notification.create({
        userId: outsider.userId,
        groupId,
        actorId: owner.userId,
        type: 'event_created',
        title: 'Outsider Notif',
        body: 'Should not see this',
        readAt: null,
      });

      // 1. List all for member (should return 2, outsider's not returned)
      const listAllRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${member.token}`);

      expect(listAllRes.status).toBe(200);
      expect(listAllRes.body.data.length).toBe(2);
      expect(listAllRes.body.meta.total).toBe(2);

      // Verify notification format matches API_CONTRACT.md
      const item = listAllRes.body.data.find((n) => n.id === n1._id.toString());
      expect(item).toBeDefined();
      expect(item.title).toBe('New Event Test');
      expect(item.type).toBe('event_created');
      expect(item.actor).toEqual(
        expect.objectContaining({
          id: owner.userId,
          name: 'Owner User',
        })
      );
      expect(item.readAt).toBeNull();
      expect(item.createdAt).toBeDefined();

      // 2. Filter unread only
      const unreadRes = await request(app)
        .get('/api/v1/notifications?unread=true')
        .set('Authorization', `Bearer ${member.token}`);

      expect(unreadRes.status).toBe(200);
      expect(unreadRes.body.data.length).toBe(1);
      expect(unreadRes.body.data[0].id).toBe(n1._id.toString());

      // 3. Unread count endpoint
      const countRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${member.token}`);

      expect(countRes.status).toBe(200);
      expect(countRes.body.data.unreadCount).toBe(1);
    });

    it('PATCH /api/v1/notifications/:id/read marks notification as read', async () => {
      const notif = await Notification.create({
        userId: member.userId,
        groupId,
        type: 'event_created',
        title: 'Mark read test',
        body: 'Body',
        readAt: null,
      });

      const res = await request(app)
        .patch(`/api/v1/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(notif._id.toString());
      expect(res.body.data.readAt).not.toBeNull();

      // Unread count should now be 0
      const countRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${member.token}`);
      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it('PATCH /api/v1/notifications/:id/read returns 404 for inaccessible or nonexistent notification', async () => {
      const notif = await Notification.create({
        userId: member.userId,
        groupId,
        type: 'event_created',
        title: 'Private notif',
        body: 'Body',
        readAt: null,
      });

      // Outsider tries to mark member's notification as read
      const res = await request(app)
        .patch(`/api/v1/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${outsider.token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('POST /api/v1/notifications/read-all marks all unread notifications as read', async () => {
      await Notification.create([
        {
          userId: member.userId,
          groupId,
          type: 'event_created',
          title: 'Notif 1',
          body: 'Body 1',
          readAt: null,
        },
        {
          userId: member.userId,
          groupId,
          type: 'event_updated',
          title: 'Notif 2',
          body: 'Body 2',
          readAt: null,
        },
      ]);

      const countBefore = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${member.token}`);
      expect(countBefore.body.data.unreadCount).toBe(2);

      const res = await request(app)
        .post('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const countAfter = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${member.token}`);
      expect(countAfter.body.data.unreadCount).toBe(0);
    });
  });

  describe('Domain Event Flow to Notifications', () => {
    it('notifies group members when an event is created (actor is excluded)', async () => {
      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now() + 90000000).toISOString();

      // Owner creates an event
      const eventRes = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Hackathon Kickoff',
          category: 'hackathon',
          priority: 'high',
          startAt,
          endAt,
          allDay: false,
          assignedToAll: true,
          hackathon: {
            name: 'Hackathon Kickoff',
            registrationUrl: 'https://example.com/register',
          },
        });

      expect(eventRes.status).toBe(201);

      // Wait a tick for async eventBus listener execution
      await new Promise((r) => setTimeout(r, 100));

      // Member should have received a notification
      const memberNotifs = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${member.token}`);

      expect(memberNotifs.body.data.length).toBe(1);
      expect(memberNotifs.body.data[0].type).toBe('event_created');
      expect(memberNotifs.body.data[0].title).toBe('New event: Hackathon Kickoff');
      expect(memberNotifs.body.data[0].actor.id).toBe(owner.userId);

      // Owner (actor) should NOT have received a notification
      const ownerNotifs = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${owner.token}`);

      expect(ownerNotifs.body.data.length).toBe(0);

      // Outsider should NOT have received a notification
      const outsiderNotifs = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${outsider.token}`);

      expect(outsiderNotifs.body.data.length).toBe(0);
    });

    it('notifies assignees only when assignedToAll is false', async () => {
      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now() + 90000000).toISOString();

      // Create a 3rd member in the group
      const member2 = await createTestUser('Second Member', 'notifmember2@test.com');
      const grpInfo = await request(app)
        .get('/api/v1/groups/me')
        .set('Authorization', `Bearer ${owner.token}`);

      await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member2.token}`)
        .send({ code: grpInfo.body.data.inviteCode });

      // Owner creates event assigned ONLY to member (not member2)
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Targeted Review',
          category: 'meeting',
          priority: 'medium',
          startAt,
          endAt,
          allDay: false,
          assignedToAll: false,
          assignedTo: [member.userId],
        });

      expect(res.status).toBe(201);
      await new Promise((r) => setTimeout(r, 100));

      // Member was assigned -> received notification
      const member1Res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${member.token}`);
      expect(member1Res.body.data.some((n) => n.title.includes('Targeted Review'))).toBe(true);

      // Member 2 was NOT assigned -> did not receive notification
      const member2Res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${member2.token}`);
      expect(member2Res.body.data.some((n) => n.title.includes('Targeted Review'))).toBe(false);
    });

    it('notifies group members when an event is updated', async () => {
      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now() + 90000000).toISOString();

      const eventRes = await request(app)
        .post(`/api/v1/groups/${groupId}/events`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          title: 'Initial Event',
          category: 'meeting',
          priority: 'low',
          startAt,
          endAt,
          allDay: false,
          assignedToAll: true,
        });

      expect(eventRes.status).toBe(201);
      const eventId = eventRes.body.data.id;
      await new Promise((r) => setTimeout(r, 50));

      // Clear notifications so far
      await Notification.deleteMany({});

      // Member updates the event title and priority
      const updateRes = await request(app)
        .patch(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          title: 'Updated Event Title',
          priority: 'high',
        });

      expect(updateRes.status).toBe(200);

      await new Promise((r) => setTimeout(r, 100));

      // Owner should receive event_updated notification
      const ownerNotifs = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${owner.token}`);

      expect(ownerNotifs.body.data.length).toBe(1);
      expect(ownerNotifs.body.data[0].type).toBe('event_updated');
      expect(ownerNotifs.body.data[0].title).toBe('Event updated: Updated Event Title');
      expect(ownerNotifs.body.data[0].actor.id).toBe(member.userId);
    });

    it('notifies group members when an event is deleted', async () => {
      const startAt = new Date(Date.now() + 86400000).toISOString();
      const endAt = new Date(Date.now() + 90000000).toISOString();

      const eventRes = await request(app)
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
        });

      const eventId = eventRes.body.data.id;
      await new Promise((r) => setTimeout(r, 50));
      await Notification.deleteMany({});

      // Owner deletes the event
      await request(app)
        .delete(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${owner.token}`);

      await new Promise((r) => setTimeout(r, 100));

      // Member should receive event_deleted notification
      const memberNotifs = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${member.token}`);

      expect(memberNotifs.body.data.length).toBe(1);
      expect(memberNotifs.body.data[0].type).toBe('event_deleted');
      expect(memberNotifs.body.data[0].title).toBe('Event deleted: Event To Delete');
    });
  });
});
