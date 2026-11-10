import { Event } from '../models/Event.js';
import { Group } from '../models/Group.js';
import { Pin } from '../models/Pin.js';
import { Participation } from '../models/Participation.js';
import { Reminder } from '../models/Reminder.js';
import { GoogleSync } from '../models/GoogleSync.js';
import { ApiError } from '../utils/ApiError.js';
import { normalizeAllDayDates } from '../utils/dates.js';
import { getPriorityWeight } from '../utils/priority.js';
import { serializeEvent } from '../utils/serializers.js';
import { eventBus } from '../utils/eventBus.js';

/**
 * Creates a reminder document given an event and user context.
 */
const createReminderDoc = async (eventId, groupId, userId, reminderData, event) => {
  let fireAt = null;

  if (reminderData.customAt) {
    fireAt = new Date(reminderData.customAt);
  } else if (reminderData.anchor === 'start') {
    const offset = reminderData.offsetMinutes || 60;
    fireAt = new Date(new Date(event.startAt).getTime() - offset * 60 * 1000);
  } else if (reminderData.anchor === 'registrationClose' && event.hackathon?.registrationClosesAt) {
    const offset = reminderData.offsetMinutes || 1440;
    fireAt = new Date(new Date(event.hackathon.registrationClosesAt).getTime() - offset * 60 * 1000);
  }

  if (fireAt) {
    await Reminder.create({
      groupId,
      eventId,
      userId,
      anchor: reminderData.anchor,
      offsetMinutes: reminderData.offsetMinutes || null,
      customAt: reminderData.customAt ? new Date(reminderData.customAt) : null,
      fireAt,
    });
  }
};

/**
 * Creates a new event.
 */
export const createEvent = async (groupId, eventData, user) => {
  if (!user.groupId || user.groupId.toString() !== groupId) {
    throw ApiError.notFound('Group not found');
  }

  const group = await Group.findById(groupId);
  if (!group) {
    throw ApiError.notFound('Group not found');
  }

  // Validate assignees belong to group
  if (!eventData.assignedToAll && Array.isArray(eventData.assignedTo)) {
    const memberIds = new Set(group.members.map((m) => m.userId.toString()));
    for (const assigneeId of eventData.assignedTo) {
      if (!memberIds.has(assigneeId.toString())) {
        throw ApiError.badRequest(`Assignee ${assigneeId} is not a member of this group`);
      }
    }
  }

  // Handle allDay date normalization
  let startAt = new Date(eventData.startAt);
  let endAt = new Date(eventData.endAt);
  if (eventData.allDay) {
    const normalized = normalizeAllDayDates(startAt, endAt, user.timezone);
    startAt = normalized.startAt;
    endAt = normalized.endAt;
  }

  const event = await Event.create({
    ...eventData,
    groupId,
    startAt,
    endAt,
    createdBy: user._id,
    updatedBy: user._id,
  });

  // Provision creator's reminders if supplied
  if (Array.isArray(eventData.reminders) && eventData.reminders.length > 0) {
    for (const r of eventData.reminders) {
      await createReminderDoc(event._id, groupId, user._id, r, event);
    }
  }

  await event.populate([
    { path: 'createdBy', select: 'name avatarColor' },
    { path: 'updatedBy', select: 'name avatarColor' },
  ]);

  eventBus.emit('domain.event.created', { event, user, groupId });

  return serializeEvent(event, { currentUserId: user._id });
};

/**
 * Lists events for a group with filtering, calendar range querying, and sorting.
 */
export const listGroupEvents = async (groupId, query, user) => {
  if (!user.groupId || user.groupId.toString() !== groupId) {
    throw ApiError.notFound('Group not found');
  }

  const filter = { groupId };

  // Calendar query overlap: startAt <= to AND endAt >= from OR regClosesAt in range
  let hasRange = false;
  if (query.from && query.to) {
    hasRange = true;
    const fromDate = new Date(query.from);
    const toDate = new Date(query.to);

    filter.$or = [
      { startAt: { $lte: toDate }, endAt: { $gte: fromDate } },
      { 'hackathon.registrationClosesAt': { $gte: fromDate, $lte: toDate } },
    ];
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.assignee) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [{ assignedToAll: true }, { assignedTo: query.assignee }],
    });
  }

  if (query.q) {
    const searchRegex = new RegExp(query.q.trim(), 'i');
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { 'hackathon.name': searchRegex },
      ],
    });
  }

  let dbQuery = Event.find(filter).populate([
    { path: 'createdBy', select: 'name avatarColor' },
    { path: 'updatedBy', select: 'name avatarColor' },
  ]);

  if (!hasRange && query.page && query.limit) {
    const skip = (query.page - 1) * query.limit;
    dbQuery = dbQuery.skip(skip).limit(query.limit);
  } else {
    dbQuery = dbQuery.limit(500);
  }

  const rawEvents = await dbQuery.exec();

  // Sorting
  const sortDirection = query.order === 'desc' ? -1 : 1;
  const sortedEvents = [...rawEvents].sort((a, b) => {
    if (query.sort === 'priority') {
      const pA = getPriorityWeight(a.priority);
      const pB = getPriorityWeight(b.priority);
      if (pA !== pB) return (pA - pB) * sortDirection;
      return (new Date(a.startAt) - new Date(b.startAt));
    }
    if (query.sort === 'createdAt') {
      return (new Date(a.createdAt) - new Date(b.createdAt)) * sortDirection;
    }
    return (new Date(a.startAt) - new Date(b.startAt)) * sortDirection;
  });

  const eventIds = sortedEvents.map((e) => e._id);

  // Batch query relations to prevent N+1
  const [pins, participations, reminders] = await Promise.all([
    Pin.find({ groupId, eventId: { $in: eventIds } }).populate('userId', 'name avatarColor'),
    Participation.find({ groupId, eventId: { $in: eventIds } }).populate('userId', 'name avatarColor'),
    Reminder.find({ groupId, eventId: { $in: eventIds }, userId: user._id }),
  ]);

  const pinsByEvent = {};
  for (const pin of pins) {
    const eid = pin.eventId.toString();
    pinsByEvent[eid] = pinsByEvent[eid] || [];
    pinsByEvent[eid].push(pin);
  }

  const partsByEvent = {};
  for (const part of participations) {
    const eid = part.eventId.toString();
    partsByEvent[eid] = partsByEvent[eid] || [];
    partsByEvent[eid].push(part);
  }

  const remsByEvent = {};
  for (const rem of reminders) {
    const eid = rem.eventId.toString();
    remsByEvent[eid] = remsByEvent[eid] || [];
    remsByEvent[eid].push(rem);
  }

  const userIdStr = user._id.toString();

  const serialized = sortedEvents.map((event) => {
    const eid = event._id.toString();
    const eventPins = pinsByEvent[eid] || [];
    const eventParts = partsByEvent[eid] || [];
    const eventRems = remsByEvent[eid] || [];

    // Filter private pins of other users
    const visiblePins = eventPins.filter(
      (p) => p.visibility === 'group' || p.userId?._id?.toString() === userIdStr
    );

    const pinSummary = {
      pinnedBy: visiblePins.map((p) => ({
        user: {
          id: p.userId?._id?.toString() || p.userId?.toString(),
          name: p.userId?.name || '',
          avatarColor: p.userId?.avatarColor || '',
        },
        pinnedAt: p.pinnedAt ? new Date(p.pinnedAt).toISOString() : new Date().toISOString(),
        visibility: p.visibility,
      })),
      isPinnedByMe: eventPins.some((p) => p.userId?._id?.toString() === userIdStr),
    };

    const formattedParts = eventParts.map((p) => ({
      user: {
        id: p.userId?._id?.toString() || p.userId?.toString(),
        name: p.userId?.name || '',
        avatarColor: p.userId?.avatarColor || '',
      },
      status: p.status,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    }));

    const myPart = eventParts.find((p) => p.userId?._id?.toString() === userIdStr);
    const myStatus = myPart ? myPart.status : null;

    const myReminders = eventRems.map((r) => ({
      id: r._id.toString(),
      anchor: r.anchor,
      offsetMinutes: r.offsetMinutes,
      customAt: r.customAt ? new Date(r.customAt).toISOString() : null,
    }));

    // Addenda 2: calendarMarkers for hackathons in calendar range
    let calendarMarkers = undefined;
    if (
      hasRange &&
      event.hackathon?.registrationClosesAt &&
      new Date(event.hackathon.registrationClosesAt) >= new Date(query.from) &&
      new Date(event.hackathon.registrationClosesAt) <= new Date(query.to)
    ) {
      calendarMarkers = [
        {
          type: 'registrationClose',
          at: new Date(event.hackathon.registrationClosesAt).toISOString(),
        },
      ];
    }

    return serializeEvent(event, {
      currentUserId: user._id,
      pinSummary,
      participation: formattedParts,
      myStatus,
      myReminders,
      calendarMarkers,
    });
  });

  return serialized;
};

/**
 * Gets a single event by ID with group authorization.
 */
export const getEventById = async (eventId, user) => {
  const event = await Event.findById(eventId).populate([
    { path: 'createdBy', select: 'name avatarColor' },
    { path: 'updatedBy', select: 'name avatarColor' },
  ]);

  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (!user.groupId || user.groupId.toString() !== event.groupId.toString()) {
    throw ApiError.notFound('Event not found');
  }

  const userIdStr = user._id.toString();
  const [pins, parts, rems] = await Promise.all([
    Pin.find({ eventId }).populate('userId', 'name avatarColor'),
    Participation.find({ eventId }).populate('userId', 'name avatarColor'),
    Reminder.find({ eventId, userId: user._id }),
  ]);

  const visiblePins = pins.filter(
    (p) => p.visibility === 'group' || p.userId?._id?.toString() === userIdStr
  );

  const pinSummary = {
    pinnedBy: visiblePins.map((p) => ({
      user: {
        id: p.userId?._id?.toString() || p.userId?.toString(),
        name: p.userId?.name || '',
        avatarColor: p.userId?.avatarColor || '',
      },
      pinnedAt: new Date(p.pinnedAt).toISOString(),
      visibility: p.visibility,
    })),
    isPinnedByMe: pins.some((p) => p.userId?._id?.toString() === userIdStr),
  };

  const participation = parts.map((p) => ({
    user: {
      id: p.userId?._id?.toString() || p.userId?.toString(),
      name: p.userId?.name || '',
      avatarColor: p.userId?.avatarColor || '',
    },
    status: p.status,
    updatedAt: new Date(p.updatedAt).toISOString(),
  }));

  const myPart = parts.find((p) => p.userId?._id?.toString() === userIdStr);
  const myStatus = myPart ? myPart.status : null;

  const myReminders = rems.map((r) => ({
    id: r._id.toString(),
    anchor: r.anchor,
    offsetMinutes: r.offsetMinutes,
    customAt: r.customAt ? new Date(r.customAt).toISOString() : null,
  }));

  return serializeEvent(event, {
    currentUserId: user._id,
    pinSummary,
    participation,
    myStatus,
    myReminders,
  });
};

/**
 * Updates an event with diff calculation and reminder recomputation.
 */
export const updateEvent = async (eventId, updates, user) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (!user.groupId || user.groupId.toString() !== event.groupId.toString()) {
    throw ApiError.notFound('Event not found');
  }

  const diffFields = [];
  const allowed = [
    'title',
    'description',
    'category',
    'priority',
    'kind',
    'startAt',
    'endAt',
    'allDay',
    'url',
    'assignedToAll',
    'assignedTo',
    'hackathon',
  ];

  let datesChanged = false;
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (key === 'startAt' || key === 'endAt') {
        datesChanged = true;
        event[key] = new Date(updates[key]);
        diffFields.push(key);
      } else if (key === 'hackathon' && updates.hackathon) {
        datesChanged = true;
        event.hackathon = { ...event.hackathon, ...updates.hackathon };
        diffFields.push('hackathon');
      } else {
        event[key] = updates[key];
        diffFields.push(key);
      }
    }
  }

  event.updatedBy = user._id;
  await event.save();

  // If startAt, endAt, or regClosesAt changed -> recompute fireAt for reminders
  if (datesChanged) {
    const reminders = await Reminder.find({ eventId, status: { $in: ['pending', 'processing'] } });
    for (const rem of reminders) {
      if (rem.anchor === 'start' && rem.offsetMinutes) {
        rem.fireAt = new Date(event.startAt.getTime() - rem.offsetMinutes * 60 * 1000);
        rem.status = 'pending';
        await rem.save();
      } else if (
        rem.anchor === 'registrationClose' &&
        rem.offsetMinutes &&
        event.hackathon?.registrationClosesAt
      ) {
        rem.fireAt = new Date(
          new Date(event.hackathon.registrationClosesAt).getTime() - rem.offsetMinutes * 60 * 1000
        );
        rem.status = 'pending';
        await rem.save();
      }
    }
  }

  await event.populate([
    { path: 'createdBy', select: 'name avatarColor' },
    { path: 'updatedBy', select: 'name avatarColor' },
  ]);

  eventBus.emit('domain.event.updated', { event, user, diffFields });

  return serializeEvent(event, { currentUserId: user._id });
};

/**
 * Deletes an event. Only allowed for creator or group owner.
 */
export const deleteEvent = async (eventId, user) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (!user.groupId || user.groupId.toString() !== event.groupId.toString()) {
    throw ApiError.notFound('Event not found');
  }

  const group = await Group.findById(event.groupId);
  const isOwner = group && group.ownerId.toString() === user._id.toString();
  const isCreator = event.createdBy.toString() === user._id.toString();

  if (!isOwner && !isCreator) {
    throw ApiError.forbidden('Only the event creator or group owner can delete this event');
  }

  // Cascade delete relations
  await Promise.all([
    Reminder.deleteMany({ eventId }),
    Pin.deleteMany({ eventId }),
    Participation.deleteMany({ eventId }),
    GoogleSync.deleteMany({ eventId }),
    Event.deleteOne({ _id: eventId }),
  ]);

  eventBus.emit('domain.event.deleted', {
    eventId,
    title: event.title,
    groupId: event.groupId,
    actorId: user._id,
    actorName: user.name,
  });

  return { message: 'Event deleted successfully' };
};

/**
 * Marks an event as completed.
 */
export const completeEvent = async (eventId, user) => {
  const event = await Event.findById(eventId).populate([
    { path: 'createdBy', select: 'name avatarColor' },
    { path: 'updatedBy', select: 'name avatarColor' },
  ]);

  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (!user.groupId || user.groupId.toString() !== event.groupId.toString()) {
    throw ApiError.notFound('Event not found');
  }

  event.status = 'completed';
  event.completedAt = new Date();
  event.completedBy = user._id;
  event.updatedBy = user._id;
  await event.save();

  // Cancel pending reminders
  await Reminder.updateMany({ eventId, status: 'pending' }, { status: 'cancelled' });

  eventBus.emit('domain.event.completed', { event, user });

  return serializeEvent(event, { currentUserId: user._id });
};

/**
 * Reverts an event to pending status.
 */
export const uncompleteEvent = async (eventId, user) => {
  const event = await Event.findById(eventId).populate([
    { path: 'createdBy', select: 'name avatarColor' },
    { path: 'updatedBy', select: 'name avatarColor' },
  ]);

  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (!user.groupId || user.groupId.toString() !== event.groupId.toString()) {
    throw ApiError.notFound('Event not found');
  }

  event.status = 'pending';
  event.completedAt = null;
  event.completedBy = null;
  event.updatedBy = user._id;
  await event.save();

  // Restore future reminders
  await Reminder.updateMany(
    { eventId, status: 'cancelled', fireAt: { $gt: new Date() } },
    { status: 'pending' }
  );

  eventBus.emit('domain.event.updated', { event, user, diffFields: ['status'] });

  return serializeEvent(event, { currentUserId: user._id });
};
