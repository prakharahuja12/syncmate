import * as eventService from '../services/event.service.js';
import { successResponse } from '../utils/response.js';

export const createEvent = async (req, res) => {
  const result = await eventService.createEvent(req.params.gid, req.body, req.user);
  return successResponse(res, result, 201);
};

export const listGroupEvents = async (req, res) => {
  const result = await eventService.listGroupEvents(req.params.gid, req.query, req.user);
  return successResponse(res, result, 200);
};

export const getEventById = async (req, res) => {
  const result = await eventService.getEventById(req.params.id, req.user);
  return successResponse(res, result, 200);
};

export const updateEvent = async (req, res) => {
  const result = await eventService.updateEvent(req.params.id, req.body, req.user);
  return successResponse(res, result, 200);
};

export const deleteEvent = async (req, res) => {
  const result = await eventService.deleteEvent(req.params.id, req.user);
  return successResponse(res, result, 200);
};

export const completeEvent = async (req, res) => {
  const result = await eventService.completeEvent(req.params.id, req.user);
  return successResponse(res, result, 200);
};

export const uncompleteEvent = async (req, res) => {
  const result = await eventService.uncompleteEvent(req.params.id, req.user);
  return successResponse(res, result, 200);
};
