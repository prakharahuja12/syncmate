/**
 * templates/test.template.js
 * Standard Supertest + in-memory MongoDB integration test pattern for SyncMate.
 */
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Group } from '../src/models/Group.js';
import { generateAccessToken } from '../src/services/auth.service.js';

describe('POST /api/v1/resource', () => {
  let userA, groupA, tokenA;
  let userB, groupB, tokenB;

  beforeEach(async () => {
    // Setup Group A & User A
    groupA = await Group.create({ name: 'Group Alpha', inviteCode: 'ALPHA123' });
    userA = await User.create({
      name: 'User A',
      email: 'a@demo.com',
      passwordHash: 'hash',
      groupId: groupA._id
    });
    groupA.ownerId = userA._id;
    groupA.members.push({ userId: userA._id, role: 'owner' });
    await groupA.save();
    tokenA = generateAccessToken(userA);

    // Setup Group B & User B for cross-group test
    groupB = await Group.create({ name: 'Group Beta', inviteCode: 'BETA1234' });
    userB = await User.create({
      name: 'User B',
      email: 'b@demo.com',
      passwordHash: 'hash',
      groupId: groupB._id
    });
    tokenB = generateAccessToken(userB);
  });

  test('200: Happy path returns contract envelope', async () => {
    const res = await request(app)
      .post('/api/v1/groups/' + groupA._id + '/events')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Meeting',
        category: 'meeting',
        priority: 'medium',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  test('404: Cross-group isolation test', async () => {
    const res = await request(app)
      .post('/api/v1/groups/' + groupA._id + '/events')
      .set('Authorization', `Bearer ${tokenB}`) // User B attempting Group A
      .send({ title: 'Hack' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

