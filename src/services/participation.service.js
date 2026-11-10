import { Participation } from '../models/Participation.js';
import { Event } from '../models/Event.js';
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { eventBus } from '../utils/eventBus.js';
import { cancelRegistrationReminders } from './reminder.service.js';

export async function getFormattedParticipation(eventId, groupId) {
  const group = await Group.findById(groupId).populate('members.userId', 'name avatarColor');
  const participations = await Participation.find({ eventId });

  const partByUser = {};
  for (const p of participations) {
    partByUser[p.userId.toString()] = p;
  }

  const members = group?.members || [];
  return members.map((m) => {
    const userObj = m.userId;
    const userId = userObj?._id?.toString() || userObj?.toString();
    const part = partByUser[userId];

    return {
      user: {
        id: userId,
        name: userObj?.name || 'Group Member',
        avatarColor: userObj?.avatarColor || '',
      },
      status: part ? part.status : null,
      updatedAt: part?.updatedAt ? new Date(part.updatedAt).toISOString() : null,
    };
  });
}

export async function setMyStatus({ eventId, userId, groupId, status }) {
  const event = await Event.findOne({ _id: eventId, groupId });
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  await Participation.findOneAndUpdate(
    { eventId, userId },
    { $set: { groupId, status, updatedAt: new Date() } },
    { upsert: true, new: true }
  );

  const user = await User.findById(userId);

  // If status is registered, cancel registrationClose reminders and notify others
  if (status === 'registered') {
    await cancelRegistrationReminders(eventId, userId);
    eventBus.emit('domain.status.registered', { event, user, groupId });
  }

  const participation = await getFormattedParticipation(eventId, groupId);

  // Emit realtime update to group
  eventBus.emit('status:changed', {
    groupId: groupId.toString(),
    eventId: eventId.toString(),
    participation,
  });

  return { myStatus: status, participation };
}

export async function getEventParticipation({ eventId, groupId }) {
  const event = await Event.findOne({ _id: eventId, groupId });
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  return getFormattedParticipation(eventId, groupId);
}
