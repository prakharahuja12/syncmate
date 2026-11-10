import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Group } from '../src/models/Group.js';
import { Event } from '../src/models/Event.js';
import { Pin } from '../src/models/Pin.js';

describe('Group Endpoints & Workflows (Phase 2)', () => {
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

  describe('POST /api/v1/groups (Create Group)', () => {
    it('successfully creates a group and assigns caller as owner', async () => {
      const { token, userId } = await createTestUser('Alice Owner', 'alice@test.com');

      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Alpha Squad' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Alpha Squad');
      expect(res.body.data.ownerId).toBe(userId);
      expect(res.body.data.inviteCode).toBeDefined();
      expect(res.body.data.inviteCode.length).toBe(8);
      expect(res.body.data.members.length).toBe(1);
      expect(res.body.data.members[0].id).toBe(userId);
      expect(res.body.data.members[0].role).toBe('owner');

      // Verify user's groupId was updated in database
      const user = await User.findById(userId);
      expect(user.groupId.toString()).toBe(res.body.data.id);
    });

    it('rejects creating a group if user is already in a group with 409 CONFLICT', async () => {
      const { token } = await createTestUser('Bob Busy', 'bob@test.com');

      // First group
      await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'First Group' });

      // Attempt second group
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Second Group' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already belongs to a group');
    });

    it('validates group name input', async () => {
      const { token } = await createTestUser('Empty Name User', 'empty@test.com');

      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/groups/me', () => {
    it('returns group details with inviteCode for owner', async () => {
      const { token, userId } = await createTestUser('Owner Me', 'ownerme@test.com');
      const createRes = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Group' });

      const res = await request(app)
        .get('/api/v1/groups/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createRes.body.data.id);
      expect(res.body.data.ownerId).toBe(userId);
      expect(res.body.data.inviteCode).toBeDefined();
    });

    it('returns group details WITHOUT inviteCode for regular member', async () => {
      const owner = await createTestUser('Lead', 'lead@test.com');
      const member = await createTestUser('Colleague', 'colleague@test.com');

      const createRes = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Shared Team' });

      const inviteCode = createRes.body.data.inviteCode;

      // Member joins
      await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ code: inviteCode });

      // Member checks /groups/me
      const res = await request(app)
        .get('/api/v1/groups/me')
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createRes.body.data.id);
      expect(res.body.data.inviteCode).toBeUndefined();
    });

    it('returns 404 if user has no group', async () => {
      const { token } = await createTestUser('No Group User', 'nogroup@test.com');

      const res = await request(app)
        .get('/api/v1/groups/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/groups/invite/:code/preview (PUBLIC)', () => {
    let inviteCode;

    beforeEach(async () => {
      const owner = await createTestUser('Preview Owner', 'previewowner@test.com');
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Hackathon Heroes' });
      inviteCode = res.body.data.inviteCode;
    });

    it('returns preview without auth and without exposing member details', async () => {
      const res = await request(app).get(`/api/v1/groups/invite/${inviteCode}/preview`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.groupName).toBe('Hackathon Heroes');
      expect(res.body.data.memberCount).toBe(1);
      expect(res.body.data.maxMembers).toBe(5);
      expect(res.body.data.members).toBeUndefined();
      expect(res.body.data.ownerId).toBeUndefined();
    });

    it('matches invite code case-insensitively', async () => {
      const res = await request(app).get(
        `/api/v1/groups/invite/${inviteCode.toLowerCase()}/preview`
      );
      expect(res.status).toBe(200);
      expect(res.body.data.groupName).toBe('Hackathon Heroes');
    });

    it('returns 410 INVITE_INVALID for invalid or non-existent code', async () => {
      const res = await request(app).get('/api/v1/groups/invite/INVALID9/preview');

      expect(res.status).toBe(410);
      expect(res.body.error.code).toBe('INVITE_INVALID');
    });
  });

  describe('POST /api/v1/groups/join', () => {
    let inviteCode;
    let groupId;

    beforeEach(async () => {
      const owner = await createTestUser('Team Creator', 'creator@test.com');
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Dream Team' });
      inviteCode = res.body.data.inviteCode;
      groupId = res.body.data.id;
    });

    it('successfully joins group and assigns user groupId', async () => {
      const newMember = await createTestUser('New Member', 'joiner@test.com');

      const res = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${newMember.token}`)
        .send({ code: inviteCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(groupId);
      expect(res.body.data.members.length).toBe(2);

      const user = await User.findById(newMember.userId);
      expect(user.groupId.toString()).toBe(groupId);
    });

    it('rejects joining if code is invalid with 410 INVITE_INVALID', async () => {
      const member = await createTestUser('Invalid Joiner', 'invjoiner@test.com');

      const res = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ code: 'FAKECODE' });

      expect(res.status).toBe(410);
      expect(res.body.error.code).toBe('INVITE_INVALID');
    });

    it('rejects joining if user already in a group with 409 CONFLICT', async () => {
      const otherGroup = await createTestUser('Other Group User', 'othergrp@test.com');
      await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${otherGroup.token}`)
        .send({ name: 'Another Group' });

      const res = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${otherGroup.token}`)
        .send({ code: inviteCode });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('enforces maximum 5 members and rejects 6th with 409 GROUP_FULL', async () => {
      // 1 owner already exists. Add 3 members (total 4)
      for (let i = 1; i <= 3; i++) {
        const u = await createTestUser(`Member ${i}`, `m${i}@test.com`);
        await request(app)
          .post('/api/v1/groups/join')
          .set('Authorization', `Bearer ${u.token}`)
          .send({ code: inviteCode });
      }

      // Add 4th member (total 5 = maximum allowed)
      const fifth = await createTestUser('Fifth Member', 'fifth@test.com');
      const fifthRes = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${fifth.token}`)
        .send({ code: inviteCode });
      expect(fifthRes.status).toBe(200);

      // Attempt 6th member -> should be rejected with GROUP_FULL
      const sixth = await createTestUser('Sixth Member', 'sixth@test.com');
      const sixthRes = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${sixth.token}`)
        .send({ code: inviteCode });

      expect(sixthRes.status).toBe(409);
      expect(sixthRes.body.error.code).toBe('GROUP_FULL');
      expect(sixthRes.body.error.message).toContain('maximum member limit');
    });
  });

  describe('PATCH /api/v1/groups/:gid (Update Group)', () => {
    let owner;
    let member;
    let outsider;
    let groupId;

    beforeEach(async () => {
      owner = await createTestUser('Owner', 'grpowner@test.com');
      member = await createTestUser('Member', 'grpmember@test.com');
      outsider = await createTestUser('Outsider', 'outsider@test.com');

      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Initial Group Name' });
      groupId = res.body.data.id;

      await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ code: res.body.data.inviteCode });
    });

    it('allows owner to update group name', async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Renamed Alpha Squad' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Renamed Alpha Squad');
    });

    it('rejects update by non-owner member with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ name: 'Member Rename Attempt' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects update by user not in the group with 404 NOT_FOUND', async () => {
      const res = await request(app)
        .patch(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${outsider.token}`)
        .send({ name: 'Outsider Rename Attempt' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/groups/:gid/invite/regenerate', () => {
    let owner;
    let member;
    let groupId;
    let oldCode;

    beforeEach(async () => {
      owner = await createTestUser('Regen Owner', 'regenowner@test.com');
      member = await createTestUser('Regen Member', 'regenmember@test.com');

      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Regen Test Group' });
      groupId = res.body.data.id;
      oldCode = res.body.data.inviteCode;

      await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ code: oldCode });
    });

    it('allows owner to regenerate invite code and invalidates previous code', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/invite/regenerate`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.inviteCode).toBeDefined();
      expect(res.body.data.inviteCode).not.toBe(oldCode);

      // Verify old code is now invalid
      const oldPreview = await request(app).get(`/api/v1/groups/invite/${oldCode}/preview`);
      expect(oldPreview.status).toBe(410);

      // Verify new code is valid
      const newPreview = await request(app).get(
        `/api/v1/groups/invite/${res.body.data.inviteCode}/preview`
      );
      expect(newPreview.status).toBe(200);
    });

    it('rejects regeneration by non-owner member with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/invite/regenerate`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/groups/:gid/members/:userId (Remove Member)', () => {
    let owner;
    let member;
    let groupId;

    beforeEach(async () => {
      owner = await createTestUser('Remove Owner', 'rmowner@test.com');
      member = await createTestUser('Target Member', 'targetm@test.com');

      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Removal Team' });
      groupId = res.body.data.id;

      await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ code: res.body.data.inviteCode });
    });

    it('allows owner to remove a member and clears member groupId', async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/members/${member.userId}`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const group = await Group.findById(groupId);
      expect(group.members.some((m) => m.userId.toString() === member.userId)).toBe(false);

      const user = await User.findById(member.userId);
      expect(user.groupId).toBeNull();
    });

    it('prevents owner from removing themselves', async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/members/${owner.userId}`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects removal by non-owner member with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}/members/${member.userId}`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/groups/:gid/leave (Leave Group)', () => {
    let owner;
    let member;
    let groupId;

    beforeEach(async () => {
      owner = await createTestUser('Leave Owner', 'leaveowner@test.com');
      member = await createTestUser('Leave Member', 'leavem@test.com');

      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Leaving Squad' });
      groupId = res.body.data.id;

      await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ code: res.body.data.inviteCode });
    });

    it('allows regular member to leave group and clears their groupId', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/leave`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findById(member.userId);
      expect(user.groupId).toBeNull();

      const group = await Group.findById(groupId);
      expect(group.members.length).toBe(1);
    });

    it('prevents owner from leaving while other members exist', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/leave`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('Transfer ownership or delete the group');
    });
  });

  describe('POST /api/v1/groups/:gid/transfer-owner', () => {
    let owner;
    let member;
    let groupId;

    beforeEach(async () => {
      owner = await createTestUser('Transfer Owner', 'xferowner@test.com');
      member = await createTestUser('Successor', 'successor@test.com');

      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Succession Group' });
      groupId = res.body.data.id;

      await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ code: res.body.data.inviteCode });
    });

    it('successfully transfers ownership to existing member', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/transfer-owner`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ userId: member.userId });

      expect(res.status).toBe(200);
      expect(res.body.data.ownerId).toBe(member.userId);

      const group = await Group.findById(groupId);
      expect(group.ownerId.toString()).toBe(member.userId);

      const memberDoc = group.members.find((m) => m.userId.toString() === member.userId);
      expect(memberDoc.role).toBe('owner');

      const prevOwnerDoc = group.members.find((m) => m.userId.toString() === owner.userId);
      expect(prevOwnerDoc.role).toBe('member');
    });

    it('rejects transfer to non-member with 400 VALIDATION_ERROR', async () => {
      const outsider = await createTestUser('Stranger', 'stranger@test.com');

      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/transfer-owner`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ userId: outsider.userId });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects transfer by non-owner with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/transfer-owner`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ userId: owner.userId });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/groups/:gid (Delete Group)', () => {
    let owner;
    let member;
    let groupId;

    beforeEach(async () => {
      owner = await createTestUser('Delete Owner', 'delowner@test.com');
      member = await createTestUser('Delete Member', 'delmember@test.com');

      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Group To Delete' });
      groupId = res.body.data.id;

      await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ code: res.body.data.inviteCode });

      // Create dummy event and pin to test cascade
      const event = await Event.create({
        groupId,
        title: 'Cascade Event',
        category: 'meeting',
        startAt: new Date(),
        endAt: new Date(Date.now() + 3600000),
        createdBy: owner.userId,
        updatedBy: owner.userId,
      });

      await Pin.create({
        groupId,
        eventId: event._id,
        userId: member.userId,
      });
    });

    it('allows owner to delete group and cascade deletes resources', async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${owner.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify group removed
      const groupDoc = await Group.findById(groupId);
      expect(groupDoc).toBeNull();

      // Verify members' groupId cleared
      const u1 = await User.findById(owner.userId);
      const u2 = await User.findById(member.userId);
      expect(u1.groupId).toBeNull();
      expect(u2.groupId).toBeNull();

      // Verify cascade deletion of events and pins
      const events = await Event.find({ groupId });
      expect(events.length).toBe(0);

      const pins = await Pin.find({ groupId });
      expect(pins.length).toBe(0);
    });

    it('rejects deletion by non-owner member with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .delete(`/api/v1/groups/${groupId}`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(403);
    });
  });
});
