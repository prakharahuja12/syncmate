import { ApiError } from '../utils/ApiError.js';
import { Group } from '../models/Group.js';

/**
 * Middleware ensuring the authenticated user belongs to the group specified in :gid.
 * Returns 404 if user is in a different group or group does not exist (prevents resource existence leakage).
 */
export const verifyGroupAccess = (req, _res, next) => {
  const { gid } = req.params;

  if (!req.user || !req.user.groupId) {
    return next(ApiError.notFound('Group not found'));
  }

  if (req.user.groupId.toString() !== gid) {
    return next(ApiError.notFound('Group not found'));
  }

  next();
};

/**
 * Middleware ensuring the authenticated user is the owner of the group specified in :gid.
 */
export const requireGroupOwner = async (req, _res, next) => {
  const { gid } = req.params;

  if (!req.user || !req.user.groupId || req.user.groupId.toString() !== gid) {
    return next(ApiError.notFound('Group not found'));
  }

  const group = await Group.findById(gid);
  if (!group) {
    return next(ApiError.notFound('Group not found'));
  }

  if (group.ownerId.toString() !== req.user._id.toString()) {
    return next(ApiError.forbidden('Only the group owner can perform this action'));
  }

  req.group = group;
  next();
};

