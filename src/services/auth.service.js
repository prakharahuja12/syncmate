import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Group } from '../models/Group.js';
import { ApiError } from '../utils/ApiError.js';
import { hashToken, generateToken } from '../utils/crypto.js';
import { serializeUser, serializeGroup } from '../utils/serializers.js';
import { env } from '../config/env.js';

const AVATAR_PALETTE = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
];

/**
 * Returns a random avatar color from the predefined palette.
 * @returns {string} Hex color
 */
const getRandomAvatarColor = () => {
  return AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];
};

/**
 * Generates an access JWT for a user.
 *
 * @param {string} userId
 * @param {string|null} [groupId=null]
 * @returns {string} JWT access token
 */
export const generateAccessToken = (userId, groupId = null) => {
  return jwt.sign(
    {
      sub: userId,
      gid: groupId,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.ACCESS_TTL,
    }
  );
};

/**
 * Creates and persists a new rotating refresh token for a user.
 *
 * @param {string} userId
 * @param {string|null} [deviceId=null]
 * @returns {Promise<string>} Raw refresh token string
 */
export const createRefreshToken = async (userId, deviceId = null) => {
  const rawToken = generateToken(64);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId,
    tokenHash,
    deviceId,
    expiresAt,
  });

  return rawToken;
};

/**
 * Signs up a new user with email, name, and password.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string|null} [params.deviceId=null]
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
export const signup = async ({ name, email, password, deviceId = null }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('A user with this email address already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const avatarColor = getRandomAvatarColor();

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    avatarColor,
  });

  const accessToken = generateAccessToken(user._id.toString(), null);
  const refreshToken = await createRefreshToken(user._id.toString(), deviceId);

  return {
    user: serializeUser(user),
    accessToken,
    refreshToken,
  };
};

/**
 * Authenticates user credentials and issues tokens.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string|null} [params.deviceId=null]
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
export const login = async ({ email, password, deviceId = null }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const groupId = user.groupId ? user.groupId.toString() : null;
  const accessToken = generateAccessToken(user._id.toString(), groupId);
  const refreshToken = await createRefreshToken(user._id.toString(), deviceId);

  return {
    user: serializeUser(user),
    accessToken,
    refreshToken,
  };
};

/**
 * Rotates an existing refresh token and issues a new access token.
 * Performs theft detection if a revoked token is reused.
 *
 * @param {object} params
 * @param {string} params.refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
export const refreshTokens = async ({ refreshToken }) => {
  const tokenHash = hashToken(refreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Theft detection: if a revoked token is presented, revoke all sessions for this user
  if (storedToken.revokedAt) {
    await RefreshToken.updateMany(
      { userId: storedToken.userId, revokedAt: null },
      { revokedAt: new Date() }
    );
    throw ApiError.unauthorized('Refresh token was revoked; all sessions invalidated');
  }

  if (storedToken.expiresAt < new Date()) {
    throw ApiError.tokenExpired('Refresh token has expired');
  }

  const user = await User.findById(storedToken.userId);
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  // Issue new refresh token
  const newRawRefreshToken = generateToken(64);
  const newTokenHash = hashToken(newRawRefreshToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: newTokenHash,
    deviceId: storedToken.deviceId,
    expiresAt,
  });

  // Revoke the old token
  storedToken.revokedAt = new Date();
  storedToken.replacedBy = newTokenHash;
  await storedToken.save();

  const groupId = user.groupId ? user.groupId.toString() : null;
  const accessToken = generateAccessToken(user._id.toString(), groupId);

  return {
    accessToken,
    refreshToken: newRawRefreshToken,
  };
};

/**
 * Revokes a refresh token and optionally unregisters a push token.
 *
 * @param {object} params
 * @param {string} params.refreshToken
 * @param {string} [params.userId]
 * @param {string} [params.pushToken]
 * @returns {Promise<void>}
 */
export const logout = async ({ refreshToken, userId, pushToken }) => {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await RefreshToken.updateOne({ tokenHash }, { revokedAt: new Date() });
  }

  if (userId && pushToken) {
    await User.updateOne({ _id: userId }, { $pull: { pushTokens: { token: pushToken } } });
  }
};

/**
 * Fetches the current user profile and group details.
 *
 * @param {string} userId
 * @returns {Promise<{ user: object, group: object|null }>}
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  let serializedGroup = null;
  if (user.groupId) {
    const group = await Group.findById(user.groupId).populate('members.userId', 'name avatarColor');
    if (group) {
      serializedGroup = serializeGroup(group, userId);
    }
  }

  return {
    user: serializeUser(user),
    group: serializedGroup,
  };
};
