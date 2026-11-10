import { Event } from '../models/Event.js';
import { Pin } from '../models/Pin.js';
import { Participation } from '../models/Participation.js';
import { getPinSummary } from './pin.service.js';
import { getFormattedParticipation } from './participation.service.js';
import { serializeEvent } from '../utils/serializers.js';

export async function getGroupWatchlist({ groupId, userId, query = {} }) {
  const scope = query.scope || 'all';
  const sort = query.sort || 'registrationClosesAt';
  const now = new Date();

  // 1. Resolve matching pins based on scope
  const pinFilter = { groupId };
  if (scope === 'mine') {
    pinFilter.userId = userId;
  } else if (scope === 'group') {
    pinFilter.visibility = 'group';
  } else {
    // 'all': union of group pins and caller's private pins
    pinFilter.$or = [{ visibility: 'group' }, { userId }];
  }

  const matchingPins = await Pin.find(pinFilter);
  const eventIds = [...new Set(matchingPins.map((p) => p.eventId.toString()))];

  if (eventIds.length === 0) {
    return { open: [], closed: [] };
  }

  // 2. Fetch events
  const events = await Event.find({
    _id: { $in: eventIds },
    groupId,
  }).populate([
    { path: 'createdBy', select: 'name avatarColor' },
    { path: 'updatedBy', select: 'name avatarColor' },
  ]);

  // 3. Process each event into a WatchItem
  const watchItems = [];

  for (const event of events) {
    const eid = event._id.toString();

    const [pinSummary, participation, myPart] = await Promise.all([
      getPinSummary(eid, userId),
      getFormattedParticipation(eid, groupId),
      Participation.findOne({ eventId: eid, userId }),
    ]);

    const myStatus = myPart ? myPart.status : null;

    // Apply status filter on caller's status if specified
    if (query.status && myStatus !== query.status) {
      continue;
    }

    let daysToRegistrationClose = null;
    let isClosed = false;

    if (event.hackathon?.registrationClosesAt) {
      const closesAt = new Date(event.hackathon.registrationClosesAt);
      const diffMs = closesAt.getTime() - now.getTime();
      daysToRegistrationClose = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffMs < 0) {
        isClosed = true;
      }
    }

    const baseSerialized = serializeEvent(event, {
      currentUserId: userId,
      pinSummary,
      participation,
      myStatus,
    });

    watchItems.push({
      ...baseSerialized,
      daysToRegistrationClose,
      isClosed,
    });
  }

  // 4. Sort items
  watchItems.sort((a, b) => {
    if (sort === 'registrationClosesAt') {
      const aDate = a.hackathon?.registrationClosesAt ? new Date(a.hackathon.registrationClosesAt).getTime() : Infinity;
      const bDate = b.hackathon?.registrationClosesAt ? new Date(b.hackathon.registrationClosesAt).getTime() : Infinity;
      return aDate - bDate;
    }
    if (sort === 'startAt') {
      return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
    }
    if (sort === 'pinnedAt') {
      const aPin = a.pinSummary?.pinnedBy?.find((p) => p.user?.id === userId.toString()) || a.pinSummary?.pinnedBy?.[0];
      const bPin = b.pinSummary?.pinnedBy?.find((p) => p.user?.id === userId.toString()) || b.pinSummary?.pinnedBy?.[0];
      const aTime = aPin?.pinnedAt ? new Date(aPin.pinnedAt).getTime() : 0;
      const bTime = bPin?.pinnedAt ? new Date(bPin.pinnedAt).getTime() : 0;
      return bTime - aTime;
    }
    return 0;
  });

  // 5. Partition into open and closed arrays (cleanly omit helper isClosed)
  const open = watchItems.filter((item) => !item.isClosed).map(({ isClosed: _isClosed, ...rest }) => rest);
  const closed = watchItems.filter((item) => item.isClosed).map(({ isClosed: _isClosed, ...rest }) => rest);

  return { open, closed };
}
