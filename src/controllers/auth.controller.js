import * as authService from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';

export const signup = async (req, res) => {
  const result = await authService.signup(req.body);
  return successResponse(res, result, 201);
};

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  return successResponse(res, result, 200);
};

export const refresh = async (req, res) => {
  const result = await authService.refreshTokens(req.body);
  return successResponse(res, result, 200);
};

export const logout = async (req, res) => {
  await authService.logout({
    refreshToken: req.body.refreshToken,
    userId: req.user?._id?.toString(),
    pushToken: req.body.pushToken,
  });
  return successResponse(res, { message: 'Logged out successfully' }, 200);
};

export const getMe = async (req, res) => {
  const result = await authService.getMe(req.user._id.toString());
  return successResponse(res, result, 200);
};
