import * as userService from '../services/user.service.js';
import { successResponse } from '../utils/response.js';

export const updateProfile = async (req, res) => {
  const result = await userService.updateProfile(req.user._id.toString(), req.body);
  return successResponse(res, result, 200);
};

export const addPushToken = async (req, res) => {
  const result = await userService.addPushToken(req.user._id.toString(), req.body);
  return successResponse(res, result, 200);
};

export const removePushToken = async (req, res) => {
  const result = await userService.removePushToken(req.user._id.toString(), req.body.token);
  return successResponse(res, result, 200);
};
