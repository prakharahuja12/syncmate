import { customAlphabet } from 'nanoid';
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Pin } from '../models/Pin.js';
import { Participation } from '../models/Participation.js';
import { Reminder } from '../models/Reminder.js';
import { Activity } from '../models/Activity.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeGroup } from '../utils/serializers.js';
import { eventBus } from '../utils/eventBus.js';
import { env } from '../config/env.js';

// 8-character invite code using unambiguous uppercase letters & digits (excluding 0, O, 1, I)
const generateInviteCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

/**
 * Creates a unique invite code with collision retries.
 * @returns {Promise<string>}
 */
const getUniqueInviteCode = async () => {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateInviteCode();
    const existing = await Group.findOne({ inviteCode: code });
    if (!existing) return code;
    attempts++;
  }
  throw ApiError.internal('Failed to generate unique invite code. Please try again.');
};

/**
 * Creates a new group. Creator becomes owner.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.userId
 * @returns {Promise<object>} Serialized group
 */
export const createGroup = async ({ name, userId }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (user.groupId) {
    throw ApiError.conflict('User already belongs to a group');
  }

  const inviteCode = await getUniqueInviteCode();

  const group = await Group.create({
    name: name.trim(),
    ownerId: user._id,
    inviteCode,
    maxMembers: env.MAX_GROUP_MEMBERS || 5,
    members: [
      {
        userId: user._id,
        role: 'owner',
        joinedAt: new Date(),
      },
    ],
  });

  // Assign user's groupId
  user.groupId = group._id;
  await user.save();

  await group.populate('members.userId', 'name avatarColor');

  return serializeGroup(group, userId);
};

/**
 * Fetches the authenticated user's group.
 *
 * @param {string} userId
 * @returns {Promise<object>} Serialized group
 */
export const getGroupMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.groupId) {
    throw ApiError.notFound('User does not belong to any group');
  }

  const group = await Group.findById(user.groupId).populate('members.userId', 'name avatarColor');
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  return serializeGroup(group, userId);
};

/**
 * Public preview of a group via invite code (rate-limited, no sensitive member info).
 *
 * @param {string} code
 * @returns {Promise<{ groupName: string, memberCount: number, maxMembers: number }>}
 */
export const previewInvite = async (code) => {
  const normalizedCode = code.trim().toUpperCase();
  const group = await Group.findOne({ inviteCode: normalizedCode });

  if (!group) {
    throw ApiError.inviteInvalid('Invite code is invalid or has expired');
  }

  return {
    groupName: group.name,
    memberCount: group.members.length,
    maxMembers: group.maxMembers || 5,
  };
};

/**
 * Joins a group using an invite code.
 *
 * @param {object} params
 * @param {string} params.code
 * @param {string} params.userId
 * @returns {Promise<object>} Serialized group
 */
export const joinGroup = async ({ code, userId }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (user.groupId) {
    throw ApiError.conflict('User already belongs to a group');
  }

  const normalizedCode = code.trim().toUpperCase();
  const group = await Group.findOne({ inviteCode: normalizedCode });

  if (!group) {
    throw ApiError.inviteInvalid('Invite code is invalid or has expired');
  }

  const maxMembers = group.maxMembers || env.MAX_GROUP_MEMBERS || 5;
  if (group.members.length >= maxMembers) {
    throw ApiError.groupFull('Group has reached maximum member limit');
  }

  const isAlreadyMember = group.members.some(
    (m) => m.userId.toString() === user._id.toString()
  );
  if (isAlreadyMember) {
    throw ApiError.conflict('User is already a member of this group');
  }

  group.members.push({
    userId: user._id,
    role: 'member',
    joinedAt: new Date(),
  });

  await group.save();

  user.groupId = group._id;
  await user.save();

  // Decoupled domain event emission
  eventBus.emit('domain.member.joined', {
    groupId: group._id.toString(),
    user,
    actorId: user._id.toString(),
  });

  await group.populate('members.userId', 'name avatarColor');

  return serializeGroup(group, userId);
};

/**
 * Updates a group's name. Owner only.
 *
 * @param {string} groupId
 * @param {object} updates
 * @param {string} updates.name
 * @param {string} updates.userId
 * @returns {Promise<object>} Serialized group
 */
export const updateGroup = async (groupId, { name, userId }) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  if (group.ownerId.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the group owner can update the group');
  }

  group.name = name.trim();
  await group.save();

  await group.populate('members.userId', 'name avatarColor');
  return serializeGroup(group, userId);
};

/**
 * Regenerates the invite code for a group. Owner only.
 *
 * @param {string} groupId
 * @param {string} userId
 * @returns {Promise<object>} Serialized group with new inviteCode
 */
export const regenerateInviteCode = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  if (group.ownerId.toString() !== userId.toString()) {
    throw ApiError.forbidden('Only the group owner can regenerate the invite code');
  }

  const newCode = await getUniqueInviteCode();
  group.inviteCode = newCode;
  group.inviteRegeneratedAt = new Date();
  await group.save();

  await group.populate('members.userId', 'name avatarColor');
  return serializeGroup(group, userId);
};

/**
 * Removes a member from the group. Owner only.
 *
 * @param {string} groupId
 * @param {string} targetUserId
 * @param {string} callerId
 * @returns {Promise<{ message: string }>}
 */
export const removeMember = async (groupId, targetUserId, callerId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  if (group.ownerId.toString() !== callerId.toString()) {
    throw ApiError.forbidden('Only the group owner can remove members');
  }

  if (targetUserId.toString() === callerId.toString()) {
    throw ApiError.badRequest('Group owner cannot be removed. Transfer ownership or delete the group.');
  }

  const memberIndex = group.members.findIndex(
    (m) => m.userId.toString() === targetUserId.toString()
  );
  if (memberIndex === -1) {
    throw ApiError.notFound('User is not a member of this group');
  }

  group.members.splice(memberIndex, 1);
  await group.save();

  await User.updateOne({ _id: targetUserId }, { groupId: null });

  // Cascade delete member's group-scoped pins, participations, reminders
  await Promise.all([
    Pin.deleteMany({ groupId, userId: targetUserId }),
    Participation.deleteMany({ groupId, userId: targetUserId }),
    Reminder.deleteMany({ groupId, userId: targetUserId }),
  ]);

  eventBus.emit('domain.member.left', {
    groupId,
    userId: targetUserId,
    actorId: callerId,
  });

  return { message: 'Member removed successfully' };
};

/**
 * Leaves a group.
 *
 * @param {string} groupId
 * @param {string} userId
 * @returns {Promise<{ message: string }>}
 */
export const leaveGroup = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  const isOwner = group.ownerId.toString() === userId.toString();
  if (isOwner && group.members.length > 1) {
    throw ApiError.conflict('Group owner cannot leave while other members exist. Transfer ownership or delete the group.');
  }

  const memberIndex = group.members.findIndex(
    (m) => m.userId.toString() === userId.toString()
  );
  if (memberIndex === -1) {
    throw ApiError.notFound('User is not a member of this group');
  }

  group.members.splice(memberIndex, 1);

  if (group.members.length === 0) {
    await Group.deleteOne({ _id: groupId });
  } else {
    await group.save();
  }

  await User.updateOne({ _id: userId }, { groupId: null });

  // Cascade delete leaving member's pins, participations, reminders
  await Promise.all([
    Pin.deleteMany({ groupId, userId }),
    Participation.deleteMany({ groupId, userId }),
    Reminder.deleteMany({ groupId, userId }),
  ]);

  eventBus.emit('domain.member.left', {
    groupId,
    userId,
    actorId: userId,
  });

  return { message: 'Left group successfully' };
};

/**
 * Transfers group ownership to another member. Owner only.
 *
 * @param {string} groupId
 * @param {string} newOwnerId
 * @param {string} callerId
 * @returns {Promise<object>} Serialized group
 */
export const transferOwner = async (groupId, newOwnerId, callerId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  if (group.ownerId.toString() !== callerId.toString()) {
    throw ApiError.forbidden('Only the group owner can transfer ownership');
  }

  if (newOwnerId.toString() === callerId.toString()) {
    throw ApiError.badRequest('You are already the owner of this group');
  }

  const newOwnerMember = group.members.find(
    (m) => m.userId.toString() === newOwnerId.toString()
  );
  if (!newOwnerMember) {
    throw ApiError.badRequest('Target user must be a member of the group');
  }

  group.ownerId = newOwnerId;
  newOwnerMember.role = 'owner';

  const prevOwnerMember = group.members.find(
    (m) => m.userId.toString() === callerId.toString()
  );
  if (prevOwnerMember) {
    prevOwnerMember.role = 'member';
  }

  await group.save();
  await group.populate('members.userId', 'name avatarColor');

  return serializeGroup(group, callerId);
};

/**
 * Deletes a group and cascades deletion to all associated resources. Owner only.
 *
 * @param {string} groupId
 * @param {string} callerId
 * @returns {Promise<{ message: string }>}
 */
export const deleteGroup = async (groupId, callerId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  if (group.ownerId.toString() !== callerId.toString()) {
    throw ApiError.forbidden('Only the group owner can delete the group');
  }

  // Cascade delete all group data
  await Promise.all([
    Event.deleteMany({ groupId }),
    Pin.deleteMany({ groupId }),
    Participation.deleteMany({ groupId }),
    Reminder.deleteMany({ groupId }),
    Activity.deleteMany({ groupId }),
    Notification.deleteMany({ groupId }),
    User.updateMany({ groupId }, { groupId: null }),
    Group.deleteOne({ _id: groupId }),
  ]);

  eventBus.emit('group:deleted', { groupId, actorId: callerId });

  return { message: 'Group deleted successfully' };
};

