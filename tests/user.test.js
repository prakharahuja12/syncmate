import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';

describe('User Profile & Push Token Endpoints', () => {
  const app = createApp();

  let userToken;
  let userId;
  let secondUserToken;
  let secondUserId;

  beforeEach(async () => {
    // Primary User
    const res1 = await request(app).post('/api/v1/auth/signup').send({
      name: 'Primary User',
      email: 'primary@example.com',
      password: 'Password123!',
    });
    userToken = res1.body.data.accessToken;
    userId = res1.body.data.user.id;

    // Second User
    const res2 = await request(app).post('/api/v1/auth/signup').send({
      name: 'Second User',
      email: 'second@example.com',
      password: 'Password123!',
    });
    secondUserToken = res2.body.data.accessToken;
    secondUserId = res2.body.data.user.id;
  });

  describe('PATCH /api/v1/users/me', () => {
    it('requires authentication', async () => {
      const res = await request(app).patch('/api/v1/users/me').send({
        name: 'New Name',
      });
      expect(res.status).toBe(401);
    });

    it('successfully updates profile fields and settings', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Name',
          avatarColor: '#10B981',
          timezone: 'America/New_York',
          settings: {
            theme: 'dark',
            emailNotifications: true,
            pushNotifications: true,
            inAppNotifications: false,
            defaultReminderOffsets: [30, 120],
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.avatarColor).toBe('#10B981');
      expect(res.body.data.timezone).toBe('America/New_York');
      expect(res.body.data.settings.theme).toBe('dark');
      expect(res.body.data.settings.emailNotifications).toBe(true);
      expect(res.body.data.settings.pushNotifications).toBe(true);
      expect(res.body.data.settings.inAppNotifications).toBe(false);
      expect(res.body.data.settings.defaultReminderOffsets).toEqual([30, 120]);

      // Ensure passwordHash is not exposed
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('rejects invalid theme with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          settings: {
            theme: 'neon-disco', // invalid enum
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/users/me/push-tokens', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/users/me/push-tokens').send({
        token: 'fcm_token_123',
        platform: 'android',
        deviceId: 'pixel_9_pro',
      });
      expect(res.status).toBe(401);
    });

    it('successfully registers push token', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/push-tokens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          token: 'fcm_token_123',
          platform: 'android',
          deviceId: 'pixel_9_pro',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('registered');

      const user = await User.findById(userId);
      expect(user.pushTokens.length).toBe(1);
      expect(user.pushTokens[0].token).toBe('fcm_token_123');
      expect(user.pushTokens[0].platform).toBe('android');
      expect(user.pushTokens[0].deviceId).toBe('pixel_9_pro');
    });

    it('removes token from previous user if device switches accounts', async () => {
      // 1. User 1 registers token
      await request(app)
        .post('/api/v1/users/me/push-tokens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          token: 'shared_device_token',
          platform: 'ios',
          deviceId: 'iphone_16',
        });

      let u1 = await User.findById(userId);
      expect(u1.pushTokens.some((pt) => pt.token === 'shared_device_token')).toBe(true);

      // 2. User 2 logs into the same device and registers the same token
      const res = await request(app)
        .post('/api/v1/users/me/push-tokens')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          token: 'shared_device_token',
          platform: 'ios',
          deviceId: 'iphone_16',
        });

      expect(res.status).toBe(200);

      // User 2 now has it
      const u2 = await User.findById(secondUserId);
      expect(u2.pushTokens.some((pt) => pt.token === 'shared_device_token')).toBe(true);

      // User 1 had it automatically removed
      u1 = await User.findById(userId);
      expect(u1.pushTokens.some((pt) => pt.token === 'shared_device_token')).toBe(false);
    });

    it('caps user push tokens at 10 (keeps 10 most recent)', async () => {
      // Add 12 tokens
      for (let i = 1; i <= 12; i++) {
        await request(app)
          .post('/api/v1/users/me/push-tokens')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            token: `token_${i}`,
            platform: 'web',
            deviceId: `browser_${i}`,
          });
      }

      const user = await User.findById(userId);
      expect(user.pushTokens.length).toBe(10);
      // Older tokens (token_1, token_2) dropped
      expect(user.pushTokens.some((pt) => pt.token === 'token_1')).toBe(false);
      expect(user.pushTokens.some((pt) => pt.token === 'token_12')).toBe(true);
    });

    it('validates required fields', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/push-tokens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          token: '',
          platform: 'blackberry', // invalid platform
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/users/me/push-tokens', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/users/me/push-tokens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          token: 'token_to_remove',
          platform: 'web',
          deviceId: 'chrome_mac',
        });
    });

    it('successfully removes the specified push token', async () => {
      const res = await request(app)
        .delete('/api/v1/users/me/push-tokens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          token: 'token_to_remove',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findById(userId);
      expect(user.pushTokens.some((pt) => pt.token === 'token_to_remove')).toBe(false);
    });
  });
});
