import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeUser } from '../utils/serializers.js';

/**
 * Updates profile fields for the authenticated user.
 *
 * @param {string} userId
 * @param {object} updates
 * @param {string} [updates.name]
 * @param {string} [updates.avatarColor]
 * @param {string} [updates.timezone]
 * @param {object} [updates.settings]
 * @returns {Promise<object>} Serialized updated user
 */
export const updateProfile = async (userId, updates) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (updates.name !== undefined) {
    user.name = updates.name.trim();
  }

  if (updates.avatarColor !== undefined) {
    user.avatarColor = updates.avatarColor.trim();
  }

  if (updates.timezone !== undefined) {
    user.timezone = updates.timezone.trim();
  }

  if (updates.settings !== undefined) {
    user.settings = {
      theme: updates.settings.theme ?? user.settings.theme,
      emailNotifications: updates.settings.emailNotifications ?? user.settings.emailNotifications,
      pushNotifications: updates.settings.pushNotifications ?? user.settings.pushNotifications,
      inAppNotifications: updates.settings.inAppNotifications ?? user.settings.inAppNotifications,
      defaultReminderOffsets:
        updates.settings.defaultReminderOffsets ?? user.settings.defaultReminderOffsets,
    };
  }

  await user.save();
  return serializeUser(user);
};

/**
 * Registers or updates a push notification token.
 * Removes the token from other users if transferred and caps per-user tokens to 10.
 *
 * @param {string} userId
 * @param {object} tokenData
 * @param {string} tokenData.token
 * @param {'web' | 'ios' | 'android'} tokenData.platform
 * @param {string} tokenData.deviceId
 * @returns {Promise<{ message: string }>}
 */
export const addPushToken = async (userId, { token, platform, deviceId }) => {
  const cleanToken = token.trim();
  const cleanDeviceId = deviceId.trim();

  // Remove this token from all other users (handles device switching accounts)
  await User.updateMany(
    { _id: { $ne: userId }, 'pushTokens.token': cleanToken },
    { $pull: { pushTokens: { token: cleanToken } } }
  );

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Remove existing token in current user if present
  user.pushTokens = user.pushTokens.filter((pt) => pt.token !== cleanToken);

  // Add the updated token
  user.pushTokens.push({
    token: cleanToken,
    platform,
    deviceId: cleanDeviceId,
    lastSeenAt: new Date(),
  });

  // Cap at 10 tokens per user (keep most recent)
  if (user.pushTokens.length > 10) {
    user.pushTokens.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt));
    user.pushTokens = user.pushTokens.slice(0, 10);
  }

  await user.save();

  return { message: 'Push token registered successfully' };
};

/**
 * Unregisters a push notification token for the user.
 *
 * @param {string} userId
 * @param {string} token
 * @returns {Promise<{ message: string }>}
 */
export const removePushToken = async (userId, token) => {
  const cleanToken = token.trim();

  await User.updateOne({ _id: userId }, { $pull: { pushTokens: { token: cleanToken } } });

  return { message: 'Push token removed successfully' };
};
