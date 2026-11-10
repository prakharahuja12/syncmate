import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Group } from '../src/models/Group.js';
import { RefreshToken } from '../src/models/RefreshToken.js';
import { hashToken } from '../src/utils/crypto.js';

describe('Auth Endpoints & Workflows', () => {
  const app = createApp();

  describe('POST /api/v1/auth/signup', () => {
    it('successfully registers a new user and returns tokens', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send({
        name: 'Alex Johnson',
        email: 'alex@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.id).toBeDefined();
      expect(res.body.data.user.name).toBe('Alex Johnson');
      expect(res.body.data.user.email).toBe('alex@example.com');
      expect(res.body.data.user.avatarColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(res.body.data.user.timezone).toBe('Asia/Kolkata');
      expect(res.body.data.user.settings.theme).toBe('system');
      expect(res.body.data.user.settings.pushNotifications).toBe(true);
      expect(res.body.data.user.groupId).toBeNull();

      // Ensure passwordHash is NEVER exposed
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.password).toBeUndefined();

      // Tokens
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Verify token in database
      const hashed = hashToken(res.body.data.refreshToken);
      const tokenDoc = await RefreshToken.findOne({ tokenHash: hashed });
      expect(tokenDoc).toBeDefined();
      expect(tokenDoc.userId.toString()).toBe(res.body.data.user.id);
    });

    it('rejects duplicate email with 409 CONFLICT', async () => {
      await request(app).post('/api/v1/auth/signup').send({
        name: 'Alex Johnson',
        email: 'duplicate@example.com',
        password: 'Password123!',
      });

      const res = await request(app).post('/api/v1/auth/signup').send({
        name: 'Another Alex',
        email: 'DUPLICATE@example.com',
        password: 'AnotherPassword123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already exists');
    });

    it('fails validation when email is invalid or password < 8 chars', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send({
        name: '',
        email: 'not-an-email',
        password: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/signup').send({
        name: 'Login User',
        email: 'login@example.com',
        password: 'ValidPassword123!',
      });
    });

    it('successfully logs in with valid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'LOGIN@example.com',
        password: 'ValidPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('rejects invalid password with 401 UNAUTHORIZED and generic message', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'login@example.com',
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('rejects non-existent email with 401 UNAUTHORIZED and generic message', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'ghost@example.com',
        password: 'SomePassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('POST /api/v1/auth/refresh & Token Rotation', () => {
    let initialRefreshToken;

    beforeEach(async () => {
      const signupRes = await request(app).post('/api/v1/auth/signup').send({
        name: 'Rotation Tester',
        email: 'rotation@example.com',
        password: 'Password123!',
      });

      initialRefreshToken = signupRes.body.data.refreshToken;
    });

    it('rotates refresh token and returns fresh token pair', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(initialRefreshToken);

      // Verify old token is marked revoked
      const oldHash = hashToken(initialRefreshToken);
      const oldDoc = await RefreshToken.findOne({ tokenHash: oldHash });
      expect(oldDoc.revokedAt).not.toBeNull();
      expect(oldDoc.replacedBy).toBe(hashToken(res.body.data.refreshToken));

      // Verify new token works
      const secondRefresh = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: res.body.data.refreshToken,
      });
      expect(secondRefresh.status).toBe(200);
    });

    it('theft detection: reusing a revoked token revokes all user tokens', async () => {
      // 1. Legitimate refresh
      const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken,
      });
      const legitimateNewToken = refreshRes.body.data.refreshToken;

      // 2. Attacker attempts to reuse the already-revoked initialRefreshToken
      const attackRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken,
      });

      expect(attackRes.status).toBe(401);
      expect(attackRes.body.success).toBe(false);
      expect(attackRes.body.error.code).toBe('UNAUTHORIZED');

      // 3. Verify that the legitimate new token was also revoked as part of theft detection
      const legitimateHash = hashToken(legitimateNewToken);
      const legDoc = await RefreshToken.findOne({ tokenHash: legitimateHash });
      expect(legDoc.revokedAt).not.toBeNull();

      // 4. Attempting to use the legitimate new token now fails
      const failedLegitimateRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: legitimateNewToken,
      });
      expect(failedLegitimateRes.status).toBe(401);
    });

    it('rejects expired refresh token with 401 TOKEN_EXPIRED', async () => {
      // Manually backdate the refresh token expiration
      const tokenHash = hashToken(initialRefreshToken);
      await RefreshToken.updateOne(
        { tokenHash },
        { expiresAt: new Date(Date.now() - 1000 * 60) }
      );

      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken,
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('rejects non-existent refresh token with 401 UNAUTHORIZED', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: 'invalid_random_non_existent_token_string',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken;
    let refreshToken;

    beforeEach(async () => {
      const res = await request(app).post('/api/v1/auth/signup').send({
        name: 'Logout User',
        email: 'logout@example.com',
        password: 'Password123!',
      });
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('requires authentication header', async () => {
      const res = await request(app).post('/api/v1/auth/logout').send({
        refreshToken,
      });
      expect(res.status).toBe(401);
    });

    it('successfully logs out and revokes refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('Logged out');

      // Verify token is revoked
      const tokenDoc = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) });
      expect(tokenDoc.revokedAt).not.toBeNull();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let userWithoutGroupToken;
    let userWithoutGroupId;
    let ownerToken;
    let memberToken;
    let groupDoc;

    beforeEach(async () => {
      // 1. User without group
      const userRes = await request(app).post('/api/v1/auth/signup').send({
        name: 'Solo User',
        email: 'solo@example.com',
        password: 'Password123!',
      });
      userWithoutGroupToken = userRes.body.data.accessToken;
      userWithoutGroupId = userRes.body.data.user.id;

      // 2. Group Owner
      const ownerRes = await request(app).post('/api/v1/auth/signup').send({
        name: 'Team Lead',
        email: 'owner@example.com',
        password: 'Password123!',
      });
      ownerToken = ownerRes.body.data.accessToken;
      const ownerId = ownerRes.body.data.user.id;

      // 3. Group Member
      const memberRes = await request(app).post('/api/v1/auth/signup').send({
        name: 'Team Member',
        email: 'member@example.com',
        password: 'Password123!',
      });
      memberToken = memberRes.body.data.accessToken;
      const memberId = memberRes.body.data.user.id;

      // Create Group in DB
      groupDoc = await Group.create({
        name: 'SyncMate Alpha',
        ownerId: new mongoose.Types.ObjectId(ownerId),
        inviteCode: 'ALPHA123',
        members: [
          {
            userId: new mongoose.Types.ObjectId(ownerId),
            role: 'owner',
            joinedAt: new Date(),
          },
          {
            userId: new mongoose.Types.ObjectId(memberId),
            role: 'member',
            joinedAt: new Date(),
          },
        ],
      });

      // Update users with groupId
      await User.updateOne({ _id: ownerId }, { groupId: groupDoc._id });
      await User.updateOne({ _id: memberId }, { groupId: groupDoc._id });
    });

    it('rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns user and group: null for user without group', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userWithoutGroupToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(userWithoutGroupId);
      expect(res.body.data.group).toBeNull();
    });

    it('returns group with inviteCode for owner', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.group).toBeDefined();
      expect(res.body.data.group.name).toBe('SyncMate Alpha');
      expect(res.body.data.group.inviteCode).toBe('ALPHA123'); // OWNER receives inviteCode
      expect(res.body.data.group.members.length).toBe(2);
    });

    it('does NOT expose inviteCode to non-owner members', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.group).toBeDefined();
      expect(res.body.data.group.name).toBe('SyncMate Alpha');
      expect(res.body.data.group.inviteCode).toBeUndefined(); // MEMBER does NOT get inviteCode
    });
  });
});
