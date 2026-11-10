import * as dashboardService from '../services/dashboard.service.js';
import * as activityService from '../services/activity.service.js';
import { successResponse } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';

export async function getDashboard(req, res) {
  const targetGroupId = req.params.gid;
  if (!req.user.groupId || req.user.groupId.toString() !== targetGroupId) {
    throw ApiError.notFound('Group not found');
  }

  const data = await dashboardService.getGroupDashboard({
    groupId: targetGroupId,
    user: req.user,
  });

  return successResponse(res, data);
}

export async function listActivity(req, res) {
  const targetGroupId = req.params.gid;
  if (!req.user.groupId || req.user.groupId.toString() !== targetGroupId) {
    throw ApiError.notFound('Group not found');
  }

  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

  const activities = await activityService.listGroupActivity({
    groupId: targetGroupId,
    page,
    limit,
  });

  return successResponse(res, activities);
}

