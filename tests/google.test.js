import request from 'supertest';
import { jest } from '@jest/globals';
import { createApp } from '../src/app.js';
import { encrypt, decrypt } from '../src/utils/crypto.js';
import {
  shouldSync,
  syncEventForUser,
  removeGoogleEvent,
} from '../src/services/googleCalendar.service.js';
import { GoogleSync } from '../src/models/GoogleSync.js';
import { User } from '../src/models/User.js';
import { env } from '../src/config/env.js';
import { google } from 'googleapis';

describe('Google Calendar Integration & Sync (Phase 8)', () => {
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

  let userAuth;
  let userDoc;

  beforeEach(async () => {
    userAuth = await createTestUser('Google User', 'guser@test.com');
    userDoc = await User.findById(userAuth.userId);
  });

  describe('Token Security (AES-256-GCM)', () => {
    it('encrypts and decrypts refresh tokens identically without loss', () => {
      const secretRefreshToken = '1//04example_google_refresh_token_very_long_secret_12345';
      const encrypted = encrypt(secretRefreshToken, env.ENCRYPTION_KEY);

      expect(encrypted).not.toBe(secretRefreshToken);
      expect(encrypted.split(':')).toHaveLength(3); // iv:tag:ciphertext

      const decrypted = decrypt(encrypted, env.ENCRYPTION_KEY);
      expect(decrypted).toBe(secretRefreshToken);
    });

    it('fails to decrypt if payload is corrupted', () => {
      const encrypted = encrypt('token', env.ENCRYPTION_KEY);
      const corrupted = encrypted.slice(0, -4) + 'abcd';

      expect(() => decrypt(corrupted, env.ENCRYPTION_KEY)).toThrow();
    });
  });

  describe('REST Endpoints (/api/v1/integrations/google)', () => {
    it('GET /auth-url returns signed URL with state', async () => {
      const res = await request(app)
        .get('/api/v1/integrations/google/auth-url?platform=web')
        .set('Authorization', `Bearer ${userAuth.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('url');
      expect(res.body.data.url).toContain('accounts.google.com');
      expect(res.body.data.url).toContain('state=');
    });

    it('GET /status returns integration status and default preferences', async () => {
      const res = await request(app)
        .get('/api/v1/integrations/google/status')
        .set('Authorization', `Bearer ${userAuth.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.connected).toBe(false);
      expect(res.body.data.calendarId).toBe('primary');
      expect(res.body.data.preferences.mode).toBe('all');
    });

    it('PATCH /preferences updates sync preferences', async () => {
      const res = await request(app)
        .patch('/api/v1/integrations/google/preferences')
        .set('Authorization', `Bearer ${userAuth.token}`)
        .send({
          mode: 'categories',
          categories: ['hackathon', 'meeting'],
          priorities: ['high'],
          includeRegistrationDeadlines: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.mode).toBe('categories');
      expect(res.body.data.categories).toEqual(['hackathon', 'meeting']);
      expect(res.body.data.includeRegistrationDeadlines).toBe(true);
    });

    it('POST /sync-now returns success response', async () => {
      const res = await request(app)
        .post('/api/v1/integrations/google/sync-now')
        .set('Authorization', `Bearer ${userAuth.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE / disconnects Google integration and clears tokens', async () => {
      // Connect mock state
      userDoc.google = {
        connected: true,
        email: 'guser@gmail.com',
        refreshTokenEnc: encrypt('mock_token', env.ENCRYPTION_KEY),
        calendarId: 'primary',
      };
      await userDoc.save();

      const res = await request(app)
        .delete('/api/v1/integrations/google?removeEvents=false')
        .set('Authorization', `Bearer ${userAuth.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('disconnected');

      const updatedUser = await User.findById(userAuth.userId);
      expect(updatedUser.google.connected).toBe(false);
      expect(updatedUser.google.refreshTokenEnc).toBeNull();
    });
  });

  describe('Sync Preferences Engine (shouldSync)', () => {
    it('returns false if google is not connected or mode is none', () => {
      const disconnectedUser = { google: { connected: false } };
      const event = { category: 'hackathon', priority: 'high' };
      expect(shouldSync(disconnectedUser, event)).toBe(false);

      const pausedUser = { google: { connected: true, syncPreferences: { mode: 'none' } } };
      expect(shouldSync(pausedUser, event)).toBe(false);
    });

    it('returns true for mode=all', () => {
      const allUser = { google: { connected: true, syncPreferences: { mode: 'all' } } };
      const event = { category: 'personal', priority: 'low' };
      expect(shouldSync(allUser, event)).toBe(true);
    });

    it('evaluates categories and priorities mode strictly', () => {
      const user = {
        google: {
          connected: true,
          syncPreferences: {
            mode: 'categories',
            categories: ['hackathon'],
            priorities: ['high'],
          },
        },
      };

      expect(shouldSync(user, { category: 'hackathon', priority: 'high' })).toBe(true);
      expect(shouldSync(user, { category: 'meeting', priority: 'high' })).toBe(false);
      expect(shouldSync(user, { category: 'hackathon', priority: 'low' })).toBe(false);
    });

    it('evaluates assigned_to_me mode strictly', () => {
      const user = {
        _id: userAuth.userId,
        google: {
          connected: true,
          syncPreferences: { mode: 'assigned_to_me' },
        },
      };

      // Assigned explicitly to user
      expect(shouldSync(user, { assignedTo: [userAuth.userId] })).toBe(true);
      // Assigned to someone else
      expect(shouldSync(user, { assignedTo: ['507f1f77bcf86cd799439011'] })).toBe(false);
    });
  });

  describe('Sync Engine & Duplicate Prevention (Mocked Google API)', () => {
    let mockEvents;
    let mockCalendar;

    beforeEach(() => {
      mockEvents = {
        list: jest.fn().mockResolvedValue({ data: { items: [] } }),
        insert: jest.fn().mockResolvedValue({ data: { id: 'google_event_123' } }),
        patch: jest.fn().mockResolvedValue({ data: { id: 'google_event_123' } }),
        delete: jest.fn().mockResolvedValue({}),
      };

      mockCalendar = { events: mockEvents };
      jest.spyOn(google, 'calendar').mockReturnValue(mockCalendar);

      userDoc.google = {
        connected: true,
        email: 'mock@google.com',
        refreshTokenEnc: encrypt('mock_refresh_token', env.ENCRYPTION_KEY),
        calendarId: 'primary',
        syncPreferences: { mode: 'all' },
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('inserts event with extendedProperties on first sync and creates GoogleSync record', async () => {
      const mockEvent = {
        _id: '607f1f77bcf86cd799439011',
        groupId: '607f1f77bcf86cd799439012',
        title: 'SIH Hackathon',
        category: 'hackathon',
        priority: 'high',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      };

      await syncEventForUser(userDoc, mockEvent, 'event');

      expect(mockEvents.insert).toHaveBeenCalledTimes(1);
      const insertCall = mockEvents.insert.mock.calls[0][0];
      expect(insertCall.requestBody.extendedProperties.private.syncmateEventId).toBe(mockEvent._id);
      expect(insertCall.requestBody.colorId).toBe('11'); // Tomato for hackathon

      const syncRecord = await GoogleSync.findOne({ userId: userDoc._id, eventId: mockEvent._id });
      expect(syncRecord).not.toBeNull();
      expect(syncRecord.googleEventId).toBe('google_event_123');
    });

    it('skips API call if contentHash is unchanged (idempotent double sync)', async () => {
      const mockEvent = {
        _id: '607f1f77bcf86cd799439022',
        groupId: '607f1f77bcf86cd799439012',
        title: 'Meeting with Team',
        category: 'meeting',
        priority: 'medium',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      };

      await syncEventForUser(userDoc, mockEvent, 'event');
      expect(mockEvents.insert).toHaveBeenCalledTimes(1);

      // Second sync immediately after
      await syncEventForUser(userDoc, mockEvent, 'event');
      expect(mockEvents.insert).toHaveBeenCalledTimes(1);
      expect(mockEvents.patch).toHaveBeenCalledTimes(0);
    });

    it('patches Google event when content changes', async () => {
      const mockEvent = {
        _id: '607f1f77bcf86cd799439033',
        groupId: '607f1f77bcf86cd799439012',
        title: 'Initial Title',
        category: 'meeting',
        priority: 'medium',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      };

      await syncEventForUser(userDoc, mockEvent, 'event');
      expect(mockEvents.insert).toHaveBeenCalledTimes(1);

      // Modify title and re-sync
      mockEvent.title = 'Updated Title';
      await syncEventForUser(userDoc, mockEvent, 'event');

      expect(mockEvents.patch).toHaveBeenCalledTimes(1);
      const patchCall = mockEvents.patch.mock.calls[0][0];
      expect(patchCall.requestBody.summary).toContain('Updated Title');
    });

    it('deletes event from Google and removes GoogleSync record on event removal', async () => {
      const mockEventId = '607f1f77bcf86cd799439044';

      await GoogleSync.create({
        userId: userDoc._id,
        eventId: mockEventId,
        googleEventId: 'google_del_123',
        calendarId: 'primary',
        kind: 'event',
        contentHash: 'hash123',
      });

      await removeGoogleEvent(userDoc, mockEventId, 'event');

      expect(mockEvents.delete).toHaveBeenCalledTimes(1);
      const rec = await GoogleSync.findOne({ userId: userDoc._id, eventId: mockEventId });
      expect(rec).toBeNull();
    });

    it('recreates event if Google API returns 410 Gone (user deleted from Google Calendar)', async () => {
      const mockEvent = {
        _id: '607f1f77bcf86cd799439055',
        groupId: '607f1f77bcf86cd799439012',
        title: 'Resilient Event',
        category: 'other',
        priority: 'low',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      };

      await syncEventForUser(userDoc, mockEvent, 'event');

      // Now mock patch failing with 410
      mockEvents.patch.mockRejectedValueOnce({ status: 410, message: 'Resource has been deleted' });
      mockEvents.insert.mockResolvedValueOnce({ data: { id: 'recreated_google_id_456' } });

      mockEvent.title = 'Resilient Event Updated';
      await syncEventForUser(userDoc, mockEvent, 'event');

      expect(mockEvents.insert).toHaveBeenCalledTimes(2); // 1 initial + 1 recreate
      const rec = await GoogleSync.findOne({ userId: userDoc._id, eventId: mockEvent._id });
      expect(rec.googleEventId).toBe('recreated_google_id_456');
    });
  });
});
