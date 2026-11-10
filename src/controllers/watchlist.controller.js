import * as pinService from '../services/pin.service.js';
import * as participationService from '../services/participation.service.js';
import * as watchlistService from '../services/watchlist.service.js';
import { successResponse } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';

export async function pinEvent(req, res) {
  const pinSummary = await pinService.pinEvent({
    eventId: req.params.id,
    userId: req.user._id,
    groupId: req.user.groupId,
    visibility: req.body.visibility,
  });

  return successResponse(res, pinSummary);
}

export async function unpinEvent(req, res) {
  const result = await pinService.unpinEvent({
    eventId: req.params.id,
    userId: req.user._id,
    groupId: req.user.groupId,
  });

  return successResponse(res, result);
}

export async function getWatchlist(req, res) {
  const targetGroupId = req.params.gid;
  if (!req.user.groupId || req.user.groupId.toString() !== targetGroupId) {
    throw ApiError.notFound('Group not found');
  }

  const data = await watchlistService.getGroupWatchlist({
    groupId: targetGroupId,
    userId: req.user._id,
    query: req.query,
  });

  return successResponse(res, data);
}

export async function setMyStatus(req, res) {
  const result = await participationService.setMyStatus({
    eventId: req.params.id,
    userId: req.user._id,
    groupId: req.user.groupId,
    status: req.body.status,
  });

  return successResponse(res, result);
}

export async function getParticipation(req, res) {
  const participation = await participationService.getEventParticipation({
    eventId: req.params.id,
    groupId: req.user.groupId,
  });

  return successResponse(res, participation);
}

