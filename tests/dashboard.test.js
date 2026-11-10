import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Dashboard & Activity Endpoints (Phase 7)', () => {
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
  let todayEventId;
  let hackathonEventId;

  beforeEach(async () => {
    owner = await createTestUser('Alice Owner', 'dashowner@test.com');
    member = await createTestUser('Bob Member', 'dashmember@test.com');
    outsider = await createTestUser('Charlie Outsider', 'dashoutsider@test.com');

    // Create group
    const grpRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Dashboard Test Group' });
    groupId = grpRes.body.data.id;

    // Member joins group
    await request(app)
      .post('/api/v1/groups/join')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ code: grpRes.body.data.inviteCode });

    // 1. Create event for today (pending)
    const todayRes = await request(app)
      .post(`/api/v1/groups/${groupId}/events`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        title: 'Today Team Standup',
        category: 'meeting',
        priority: 'high',
        startAt: new Date(Date.now() + 3600000).toISOString(), // in 1 hour
        endAt: new Date(Date.now() + 7200000).toISOString(),
      });
    todayEventId = todayRes.body.data.id;

    // 2. Create high-priority upcoming event (in 3 days)
    await request(app)
      .post(`/api/v1/groups/${groupId}/events`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        title: 'Architecture Review',
        category: 'meeting',
        priority: 'high',
        startAt: new Date(Date.now() + 3 * 86400000).toISOString(),
        endAt: new Date(Date.now() + 3 * 86400000 + 3600000).toISOString(),
      });

    // 3. Create hackathon closing in 4 days (pinned to watchlist)
    const hackRes = await request(app)
      .post(`/api/v1/groups/${groupId}/events`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        title: 'Global AI Hackathon 2026',
        category: 'hackathon',
        priority: 'medium',
        startAt: new Date(Date.now() + 10 * 86400000).toISOString(),
        endAt: new Date(Date.now() + 12 * 86400000).toISOString(),
        hackathon: {
          name: 'AI Hackathon',
          registrationUrl: 'https://aihack.org/register',
          registrationOpensAt: new Date(Date.now() - 86400000).toISOString(),
          registrationClosesAt: new Date(Date.now() + 4 * 86400000).toISOString(),
        },
      });
    hackathonEventId = hackRes.body.data.id;

    // Bob pins hackathon to watchlist
    await request(app)
      .post(`/api/v1/events/${hackathonEventId}/pin`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ visibility: 'group' });
  });

  describe('GET /api/v1/groups/:gid/dashboard', () => {
    it('returns comprehensive aggregated dashboard data adhering to API_CONTRACT', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/dashboard`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data).toHaveProperty('today');
      expect(data).toHaveProperty('upcoming');
      expect(data).toHaveProperty('deadlines');
      expect(data).toHaveProperty('highPriority');
      expect(data).toHaveProperty('nextHighPriority');
      expect(data).toHaveProperty('recentlyAdded');
      expect(data).toHaveProperty('upcomingHackathons');
      expect(data).toHaveProperty('watchlistClosingSoon');
      expect(data).toHaveProperty('recentActivity');
      expect(data).toHaveProperty('stats');

      // Check today section
      expect(Array.isArray(data.today)).toBe(true);
      expect(data.today.some((e) => e.id === todayEventId)).toBe(true);

      // Check highPriority and nextHighPriority
      expect(data.highPriority.length).toBeGreaterThan(0);
      expect(data.nextHighPriority).not.toBeNull();
      expect(data.nextHighPriority.priority).toBe('high');

      // Check upcomingHackathons
      expect(data.upcomingHackathons.length).toBeGreaterThan(0);
      expect(data.upcomingHackathons[0].category).toBe('hackathon');

      // Check deadlines (contains deadlineAt and deadlineType)
      expect(data.deadlines.length).toBeGreaterThan(0);
      const deadline = data.deadlines[0];
      expect(deadline).toHaveProperty('deadlineAt');
      expect(deadline).toHaveProperty('deadlineType');
      expect(['event', 'registration']).toContain(deadline.deadlineType);

      // Check watchlistClosingSoon
      expect(data.watchlistClosingSoon.length).toBeGreaterThan(0);
      expect(data.watchlistClosingSoon[0].id).toBe(hackathonEventId);

      // Check stats
      expect(data.stats).toHaveProperty('pending');
      expect(data.stats).toHaveProperty('completed');
      expect(data.stats).toHaveProperty('urgent');
      expect(data.stats.pending).toBeGreaterThanOrEqual(3);
      expect(data.stats.completed).toBe(0);
      expect(typeof data.stats.urgent).toBe('number');
    });

    it('returns 404 for outsider attempting to access group dashboard', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/dashboard`)
        .set('Authorization', `Bearer ${outsider.token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/groups/:gid/activity', () => {
    it('returns paginated activity logs with actor details', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/activity?page=1&limit=10`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const activity = res.body.data[0];
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('action');
      expect(activity).toHaveProperty('summary');
      expect(activity).toHaveProperty('actor');
      expect(activity.actor).toHaveProperty('name');
      expect(activity.actor).toHaveProperty('avatarColor');
      expect(activity).toHaveProperty('createdAt');
    });

    it('returns 404 for outsider attempting to access group activity', async () => {
      const res = await request(app)
        .get(`/api/v1/groups/${groupId}/activity`)
        .set('Authorization', `Bearer ${outsider.token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});

