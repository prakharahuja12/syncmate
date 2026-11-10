import * as groupService from '../services/group.service.js';
import { successResponse } from '../utils/response.js';

export const createGroup = async (req, res) => {
  const result = await groupService.createGroup({
    name: req.body.name,
    userId: req.user._id.toString(),
  });
  return successResponse(res, result, 201);
};

export const getGroupMe = async (req, res) => {
  const result = await groupService.getGroupMe(req.user._id.toString());
  return successResponse(res, result, 200);
};

export const previewInvite = async (req, res) => {
  const result = await groupService.previewInvite(req.params.code);
  return successResponse(res, result, 200);
};

export const joinGroup = async (req, res) => {
  const result = await groupService.joinGroup({
    code: req.body.code,
    userId: req.user._id.toString(),
  });
  return successResponse(res, result, 200);
};

export const updateGroup = async (req, res) => {
  const result = await groupService.updateGroup(req.params.gid, {
    name: req.body.name,
    userId: req.user._id.toString(),
  });
  return successResponse(res, result, 200);
};

export const regenerateInviteCode = async (req, res) => {
  const result = await groupService.regenerateInviteCode(
    req.params.gid,
    req.user._id.toString()
  );
  return successResponse(res, result, 200);
};

export const removeMember = async (req, res) => {
  const result = await groupService.removeMember(
    req.params.gid,
    req.params.userId,
    req.user._id.toString()
  );
  return successResponse(res, result, 200);
};

export const leaveGroup = async (req, res) => {
  const result = await groupService.leaveGroup(
    req.params.gid,
    req.user._id.toString()
  );
  return successResponse(res, result, 200);
};

export const transferOwner = async (req, res) => {
  const result = await groupService.transferOwner(
    req.params.gid,
    req.body.userId,
    req.user._id.toString()
  );
  return successResponse(res, result, 200);
};

export const deleteGroup = async (req, res) => {
  const result = await groupService.deleteGroup(
    req.params.gid,
    req.user._id.toString()
  );
  return successResponse(res, result, 200);
};
