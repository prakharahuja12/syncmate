import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';

/**
 * Authentication middleware.
 * Verifies Bearer JWT, reloads user from DB to keep group state fresh,
 * and sets req.user and req.groupId.
 */
export const authenticate = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token is required'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(ApiError.unauthorized('Authentication token is required'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const userId = decoded.sub;

    if (!userId) {
      return next(ApiError.unauthorized('Invalid token payload'));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(ApiError.unauthorized('User not found or deleted'));
    }

    req.user = user;
    req.groupId = user.groupId ? user.groupId.toString() : null;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.tokenExpired());
    }
    return next(ApiError.unauthorized('Invalid or malformed authentication token'));
  }
};

/**
 * Ensures the authenticated user belongs to a group.
 */
export const requireGroup = (req, _res, next) => {
  if (!req.user || !req.groupId) {
    return next(ApiError.forbidden('You must belong to a group to perform this action'));
  }
  next();
};

/**
 * Ensures the authenticated user is the owner of their group.
 */
export const requireOwner = async (req, _res, next) => {
  if (!req.user || !req.groupId) {
    return next(ApiError.forbidden('You must belong to a group to perform this action'));
  }

  const group = await Group.findById(req.groupId);
  if (!group) {
    return next(ApiError.notFound('Group not found'));
  }

  if (group.ownerId.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('Only the group owner can perform this action'));
  }

  req.group = group;
  next();
};
