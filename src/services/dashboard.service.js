import { Event } from '../models/Event.js';
import { Pin } from '../models/Pin.js';
import { Participation } from '../models/Participation.js';
import { Activity } from '../models/Activity.js';
import { getUserDayBounds } from '../utils/dates.js';
import { computeUrgent } from '../utils/priority.js';
import { serializeEvent, serializeActivity } from '../utils/serializers.js';

/**
 * Aggregates all dashboard sections for a group matching 08_DASHBOARD_ACTIVITY.md and API_CONTRACT.md.
 *
 * @param {object} params
 * @param {string} params.groupId
 * @param {object} params.user
 * @returns {Promise<object>} Dashboard aggregate
 */
export async function getGroupDashboard({ groupId, user }) {
  const now = new Date();
  const timezone = user.timezone || 'Asia/Kolkata';
  const { startOfDay, endOfDay } = getUserDayBounds(now, timezone);

  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // 1. Parallel lean queries for each dashboard category
  const [
    todayEventsRaw,
    upcomingEventsRaw,
    deadlineEventsRaw,
    highEventsRaw,
    recentlyAddedRaw,
    upcomingHackathonsRaw,
    matchingPins,
    activities,
    pendingCount,
    completedCount,
    allPendingEvents,
  ] = await Promise.all([
    // Today: overlapping [startOfDay, endOfDay] user-tz, sorted startAt, pending first
    Event.find({
      groupId,
      startAt: { $lte: endOfDay },
      endAt: { $gte: startOfDay },
    }).populate([
      { path: 'createdBy', select: 'name avatarColor' },
      { path: 'updatedBy', select: 'name avatarColor' },
    ]),

    // Upcoming: startAt in (now, now+7d], pending, sorted startAt, limit 10
    Event.find({
      groupId,
      status: 'pending',
      startAt: { $gt: now, $lte: next7Days },
    })
      .sort({ startAt: 1 })
      .limit(10)
      .populate([
        { path: 'createdBy', select: 'name avatarColor' },
        { path: 'updatedBy', select: 'name avatarColor' },
      ]),

    // Deadlines: pending events with startAt or hackathon.registrationClosesAt in next 30 days
    Event.find({
      groupId,
      status: 'pending',
      $or: [
        { startAt: { $gte: now, $lte: next30Days } },
        { 'hackathon.registrationClosesAt': { $gte: now, $lte: next30Days } },
      ],
    }).populate([
      { path: 'createdBy', select: 'name avatarColor' },
      { path: 'updatedBy', select: 'name avatarColor' },
    ]),

    // High Priority: pending high, sorted startAt, limit 10
    Event.find({
      groupId,
      status: 'pending',
      priority: 'high',
    })
      .sort({ startAt: 1 })
      .limit(10)
      .populate([
        { path: 'createdBy', select: 'name avatarColor' },
        { path: 'updatedBy', select: 'name avatarColor' },
      ]),

    // Recently Added: createdAt desc, limit 10
    Event.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate([
        { path: 'createdBy', select: 'name avatarColor' },
        { path: 'updatedBy', select: 'name avatarColor' },
      ]),

    // Upcoming Hackathons: category hackathon, startAt >= now, limit 5
    Event.find({
      groupId,
      category: 'hackathon',
      startAt: { $gte: now },
    })
      .sort({ startAt: 1 })
      .limit(5)
      .populate([
        { path: 'createdBy', select: 'name avatarColor' },
        { path: 'updatedBy', select: 'name avatarColor' },
      ]),

    // Pins matching caller (group pins or caller's private pins)
    Pin.find({
      groupId,
      $or: [{ visibility: 'group' }, { userId: user._id }],
    }),

    // Recent activity: last 15
    Activity.find({ groupId })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('actorId', 'name avatarColor'),

    // Stats counts
    Event.countDocuments({ groupId, status: 'pending' }),
    Event.countDocuments({ groupId, status: 'completed' }),

    // All pending events to compute urgent count via computeUrgent
    Event.find({ groupId, status: 'pending' }).select('startAt endAt priority status hackathon.registrationClosesAt'),
  ]);

  // Sort today: pending first, then startAt asc
  const todayEvents = [...todayEventsRaw].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  // Query Watchlist Closing Soon: pinned events with registrationClosesAt in next 7 days
  const pinnedEventIds = [...new Set(matchingPins.map((p) => p.eventId.toString()))];
  let watchlistClosingSoonRaw = [];
  if (pinnedEventIds.length > 0) {
    watchlistClosingSoonRaw = await Event.find({
      _id: { $in: pinnedEventIds },
      groupId,
      'hackathon.registrationClosesAt': { $gte: now, $lte: next7Days },
    })
      .sort({ 'hackathon.registrationClosesAt': 1 })
      .populate([
        { path: 'createdBy', select: 'name avatarColor' },
        { path: 'updatedBy', select: 'name avatarColor' },
      ]);
  }

  // 2. Batch fetch pins and participations for all referenced events
  const allEventIds = [
    ...new Set([
      ...todayEvents.map((e) => e._id.toString()),
      ...upcomingEventsRaw.map((e) => e._id.toString()),
      ...deadlineEventsRaw.map((e) => e._id.toString()),
      ...highEventsRaw.map((e) => e._id.toString()),
      ...recentlyAddedRaw.map((e) => e._id.toString()),
      ...upcomingHackathonsRaw.map((e) => e._id.toString()),
      ...watchlistClosingSoonRaw.map((e) => e._id.toString()),
    ]),
  ];

  const [allPins, allParticipations] = await Promise.all([
    Pin.find({ eventId: { $in: allEventIds } }).populate('userId', 'name avatarColor'),
    Participation.find({ eventId: { $in: allEventIds } }),
  ]);

  const pinsByEvent = {};
  for (const pin of allPins) {
    const eid = pin.eventId.toString();
    pinsByEvent[eid] = pinsByEvent[eid] || [];
    pinsByEvent[eid].push(pin);
  }

  const partsByEvent = {};
  for (const part of allParticipations) {
    const eid = part.eventId.toString();
    partsByEvent[eid] = partsByEvent[eid] || [];
    partsByEvent[eid].push(part);
  }

  const userIdStr = user._id.toString();

  // Serialization helper with pinSummary and myStatus
  const serializeDashboardEvent = (event) => {
    const eid = event._id.toString();
    const eventPins = pinsByEvent[eid] || [];
    const eventParts = partsByEvent[eid] || [];

    const visiblePins = eventPins.filter(
      (p) => p.visibility === 'group' || (p.userId?._id?.toString() || p.userId?.toString()) === userIdStr
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
      isPinnedByMe: eventPins.some((p) => (p.userId?._id?.toString() || p.userId?.toString()) === userIdStr),
    };

    const myPart = eventParts.find((p) => (p.userId?._id?.toString() || p.userId?.toString()) === userIdStr);
    const myStatus = myPart ? myPart.status : null;

    return serializeEvent(event, {
      currentUserId: user._id,
      pinSummary,
      myStatus,
    });
  };

  // Build deadlines list: flatten to items sorted by nearest relevant date
  const deadlines = [];
  for (const event of deadlineEventsRaw) {
    const serialized = serializeDashboardEvent(event);
    const startMs = new Date(event.startAt).getTime();
    const regCloseMs = event.hackathon?.registrationClosesAt
      ? new Date(event.hackathon.registrationClosesAt).getTime()
      : null;

    if (startMs >= now.getTime() && startMs <= next30Days.getTime()) {
      deadlines.push({
        ...serialized,
        deadlineAt: new Date(event.startAt).toISOString(),
        deadlineType: 'event',
      });
    }

    if (regCloseMs && regCloseMs >= now.getTime() && regCloseMs <= next30Days.getTime()) {
      deadlines.push({
        ...serialized,
        deadlineAt: new Date(event.hackathon.registrationClosesAt).toISOString(),
        deadlineType: 'registration',
      });
    }
  }
  deadlines.sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime());

  // High priority & nextHighPriority (first highPriority with startAt >= now)
  const highPriority = highEventsRaw.map(serializeDashboardEvent);
  const nextHigh = highEventsRaw.find((e) => new Date(e.startAt) >= now) || null;

  // Filter watchlistClosingSoon: caller's status NOT registered/not_interested
  const watchlistClosingSoon = [];
  for (const event of watchlistClosingSoonRaw) {
    const eid = event._id.toString();
    const eventParts = partsByEvent[eid] || [];
    const myPart = eventParts.find((p) => (p.userId?._id?.toString() || p.userId?.toString()) === userIdStr);
    const myStatus = myPart ? myPart.status : null;

    if (myStatus !== 'registered' && myStatus !== 'not_interested') {
      watchlistClosingSoon.push(serializeDashboardEvent(event));
    }
  }

  // Compute urgent count
  const urgentCount = allPendingEvents.filter((e) => computeUrgent(e, now)).length;

  return {
    today: todayEvents.map(serializeDashboardEvent),
    upcoming: upcomingEventsRaw.map(serializeDashboardEvent),
    deadlines,
    highPriority,
    nextHighPriority: nextHigh ? serializeDashboardEvent(nextHigh) : null,
    recentlyAdded: recentlyAddedRaw.map(serializeDashboardEvent),
    upcomingHackathons: upcomingHackathonsRaw.map(serializeDashboardEvent),
    watchlistClosingSoon,
    recentActivity: activities.map(serializeActivity),
    stats: {
      pending: pendingCount,
      completed: completedCount,
      urgent: urgentCount,
    },
  };
}
