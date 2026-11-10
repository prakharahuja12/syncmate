import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { Event } from '../models/Event.js';
import { Pin } from '../models/Pin.js';
import { Participation } from '../models/Participation.js';
import { Reminder } from '../models/Reminder.js';
import { Activity } from '../models/Activity.js';
import { Notification } from '../models/Notification.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Idempotent seeder creating 4 demo personas, group DEMO1234, and 25 realistic events.
 */
export async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed database in production environment!');
  }

  const shouldDisconnect = mongoose.connection.readyState === 0;
  if (shouldDisconnect) {
    await mongoose.connect(env.MONGO_URI);
  }

  logger.info('Starting idempotent SyncMate database seeding...');

  // 1. Clean existing demo data idempotently
  const demoEmails = ['alex@demo.com', 'sam@demo.com', 'priya@demo.com', 'rahul@demo.com'];
  const existingUsers = await User.find({ email: { $in: demoEmails } });
  const existingUserIds = existingUsers.map((u) => u._id);
  const existingGroup = await Group.findOne({ inviteCode: 'DEMO1234' });
  const groupIds = [existingGroup?._id, ...existingUsers.map((u) => u.groupId)].filter(Boolean);

  await User.deleteMany({ email: { $in: demoEmails } });
  await Group.deleteMany({ inviteCode: 'DEMO1234' });
  if (groupIds.length > 0) {
    await Event.deleteMany({ groupId: { $in: groupIds } });
    await Activity.deleteMany({ groupId: { $in: groupIds } });
  }
  if (existingUserIds.length > 0) {
    await Pin.deleteMany({ userId: { $in: existingUserIds } });
    await Participation.deleteMany({ userId: { $in: existingUserIds } });
    await Reminder.deleteMany({ userId: { $in: existingUserIds } });
    await Notification.deleteMany({ userId: { $in: existingUserIds } });
  }

  // 2. Create 4 demo personas
  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  const [alex, sam, priya, rahul] = await User.create([
    {
      name: 'Alex Rivera',
      email: 'alex@demo.com',
      passwordHash,
      avatarColor: '#EF4444',
      timezone: 'Asia/Kolkata',
      settings: { theme: 'system', emailNotifications: true, pushNotifications: true },
    },
    {
      name: 'Sam Taylor',
      email: 'sam@demo.com',
      passwordHash,
      avatarColor: '#3B82F6',
      timezone: 'Asia/Kolkata',
      settings: { theme: 'dark', emailNotifications: false, pushNotifications: true },
    },
    {
      name: 'Priya Sharma',
      email: 'priya@demo.com',
      passwordHash,
      avatarColor: '#10B981',
      timezone: 'Asia/Kolkata',
      settings: { theme: 'light', emailNotifications: true, pushNotifications: true },
    },
    {
      name: 'Rahul Verma',
      email: 'rahul@demo.com',
      passwordHash,
      avatarColor: '#F59E0B',
      timezone: 'Asia/Kolkata',
      settings: { theme: 'system', emailNotifications: false, pushNotifications: true },
    },
  ]);

  // 3. Create Group Team Alpha
  const group = await Group.create({
    name: 'Team Alpha',
    ownerId: alex._id,
    inviteCode: 'DEMO1234',
    maxMembers: 5,
    members: [
      { userId: alex._id, role: 'owner', joinedAt: new Date(Date.now() - 30 * 86400000) },
      { userId: sam._id, role: 'member', joinedAt: new Date(Date.now() - 25 * 86400000) },
      { userId: priya._id, role: 'member', joinedAt: new Date(Date.now() - 20 * 86400000) },
      { userId: rahul._id, role: 'member', joinedAt: new Date(Date.now() - 15 * 86400000) },
    ],
  });

  await User.updateMany({ _id: { $in: [alex._id, sam._id, priya._id, rahul._id] } }, { $set: { groupId: group._id } });

  // 4. Create 25 realistic events
  const now = Date.now();
  const eventBlueprints = [
    {
      title: 'Smart India Hackathon 2026',
      category: 'hackathon',
      priority: 'high',
      kind: 'event',
      startAt: new Date(now + 10 * 86400000),
      endAt: new Date(now + 12 * 86400000),
      createdBy: alex._id,
      updatedBy: alex._id,
      hackathon: {
        name: 'Smart India Hackathon 2026',
        registrationUrl: 'https://sih.gov.in/register',
        officialUrl: 'https://sih.gov.in',
        problemStatementUrl: 'https://sih.gov.in/ps',
        registrationOpensAt: new Date(now - 7 * 86400000),
        registrationClosesAt: new Date(now + 4 * 86400000),
        location: 'New Delhi / Hybrid',
        mode: 'hybrid',
        prizePool: '₹1,00,000',
        details: 'Premier nationwide innovation challenge across ministry problem statements.',
      },
    },
    {
      title: 'HackMIT 2026 Flagship',
      category: 'hackathon',
      priority: 'high',
      kind: 'event',
      startAt: new Date(now + 18 * 86400000),
      endAt: new Date(now + 20 * 86400000),
      createdBy: priya._id,
      updatedBy: priya._id,
      hackathon: {
        name: 'HackMIT 2026',
        registrationUrl: 'https://hackmit.org/apply',
        officialUrl: 'https://hackmit.org',
        registrationOpensAt: new Date(now - 10 * 86400000),
        registrationClosesAt: new Date(now + 6 * 86400000),
        mode: 'online',
        prizePool: '$30,000',
      },
    },
    {
      title: 'Weekly Sprint Planning',
      category: 'meeting',
      priority: 'high',
      startAt: new Date(now + 1 * 86400000),
      endAt: new Date(now + 1 * 86400000 + 3600000),
      createdBy: alex._id,
      updatedBy: alex._id,
      url: 'https://meet.google.com/abc-defg-hij',
    },
    {
      title: 'Daily Standup Sync',
      category: 'meeting',
      priority: 'medium',
      startAt: new Date(now + 2 * 3600000),
      endAt: new Date(now + 2 * 3600000 + 1800000),
      createdBy: sam._id,
      updatedBy: sam._id,
    },
    {
      title: 'Final Year Capstone Milestone',
      category: 'college',
      priority: 'high',
      allDay: true,
      startAt: new Date(now + 5 * 86400000),
      endAt: new Date(now + 5 * 86400000),
      createdBy: rahul._id,
      updatedBy: rahul._id,
    },
    {
      title: 'Database Systems Midterm Exam',
      category: 'college',
      priority: 'high',
      allDay: true,
      startAt: new Date(now + 7 * 86400000),
      endAt: new Date(now + 7 * 86400000),
      createdBy: alex._id,
      updatedBy: alex._id,
    },
    {
      title: 'Google Cloud GenAI Hackathon',
      category: 'competition',
      priority: 'high',
      startAt: new Date(now + 14 * 86400000),
      endAt: new Date(now + 15 * 86400000),
      createdBy: priya._id,
      updatedBy: priya._id,
      url: 'https://cloud.google.com/hackathons',
    },
    {
      title: 'Algorithmic Coding Showdown',
      category: 'competition',
      priority: 'medium',
      startAt: new Date(now + 8 * 86400000),
      endAt: new Date(now + 8 * 86400000 + 7200000),
      createdBy: sam._id,
      updatedBy: sam._id,
    },
    {
      title: 'Team Pizza & Chill Out',
      category: 'personal',
      priority: 'low',
      startAt: new Date(now + 3 * 86400000),
      endAt: new Date(now + 3 * 86400000 + 7200000),
      createdBy: rahul._id,
      updatedBy: rahul._id,
    },
    {
      title: 'System Design Book Club: DDIA Chapter 6',
      category: 'personal',
      priority: 'low',
      startAt: new Date(now + 4 * 86400000),
      endAt: new Date(now + 4 * 86400000 + 3600000),
      createdBy: alex._id,
      updatedBy: alex._id,
    },
  ];

  // Append 15 more diverse items to reach 25
  for (let i = 11; i <= 25; i++) {
    eventBlueprints.push({
      title: `Team Project Milestone #${i}`,
      category: i % 2 === 0 ? 'meeting' : 'other',
      priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
      startAt: new Date(now + i * 86400000),
      endAt: new Date(now + i * 86400000 + 3600000),
      createdBy: alex._id,
      updatedBy: alex._id,
      status: i < 14 ? 'completed' : 'pending',
      completedAt: i < 14 ? new Date(now - 86400000) : null,
      completedBy: i < 14 ? alex._id : null,
    });
  }

  const createdEvents = await Event.create(
    eventBlueprints.map((b) => ({ ...b, groupId: group._id }))
  );

  const sihEvent = createdEvents[0];

  // 5. Seed Pins on SIH 2026
  await Pin.create([
    {
      groupId: group._id,
      eventId: sihEvent._id,
      userId: alex._id,
      visibility: 'group',
      pinnedAt: new Date(now - 2 * 86400000),
    },
    {
      groupId: group._id,
      eventId: sihEvent._id,
      userId: priya._id,
      visibility: 'private',
      pinnedAt: new Date(now - 1 * 86400000),
    },
  ]);

  // 6. Seed Participations
  await Participation.create([
    {
      groupId: group._id,
      eventId: sihEvent._id,
      userId: priya._id,
      status: 'registered',
      updatedAt: new Date(now - 1 * 86400000),
    },
    {
      groupId: group._id,
      eventId: sihEvent._id,
      userId: alex._id,
      status: 'planning',
      updatedAt: new Date(now - 2 * 86400000),
    },
    {
      groupId: group._id,
      eventId: sihEvent._id,
      userId: sam._id,
      status: 'interested',
      updatedAt: new Date(now - 3 * 86400000),
    },
  ]);

  // 7. Seed Reminders
  await Reminder.create([
    {
      groupId: group._id,
      eventId: sihEvent._id,
      userId: alex._id,
      anchor: 'registrationClose',
      offsetMinutes: 4320, // 3 days
      fireAt: new Date(now + 1 * 86400000),
      status: 'pending',
    },
    {
      groupId: group._id,
      eventId: sihEvent._id,
      userId: alex._id,
      anchor: 'registrationClose',
      offsetMinutes: 1440, // 1 day
      fireAt: new Date(now + 3 * 86400000),
      status: 'pending',
    },
  ]);

  // 8. Seed Activity logs
  await Activity.create([
    {
      groupId: group._id,
      actorId: alex._id,
      action: 'event.created',
      eventId: sihEvent._id,
      summary: 'Alex Rivera added Smart India Hackathon 2026',
      createdAt: new Date(now - 4 * 86400000),
    },
    {
      groupId: group._id,
      actorId: alex._id,
      action: 'pin.added',
      eventId: sihEvent._id,
      summary: 'Alex Rivera pinned Smart India Hackathon 2026',
      createdAt: new Date(now - 2 * 86400000),
    },
    {
      groupId: group._id,
      actorId: priya._id,
      action: 'status.changed',
      eventId: sihEvent._id,
      summary: 'Priya Sharma registered for Smart India Hackathon 2026',
      createdAt: new Date(now - 1 * 86400000),
    },
  ]);

  // 9. Seed In-app Notifications
  await Notification.create([
    {
      userId: sam._id,
      groupId: group._id,
      actorId: alex._id,
      type: 'pin_added',
      title: 'Event pinned',
      body: 'Alex Rivera pinned Smart India Hackathon 2026',
      data: { eventId: sihEvent._id.toString(), deepLink: `/event/${sihEvent._id}` },
    },
    {
      userId: alex._id,
      groupId: group._id,
      actorId: priya._id,
      type: 'status_changed',
      title: 'Member registered',
      body: 'Priya Sharma registered for Smart India Hackathon 2026 ✅',
      data: { eventId: sihEvent._id.toString(), deepLink: `/event/${sihEvent._id}` },
    },
  ]);

  logger.info('Database seeded successfully: 4 personas, group DEMO1234, 25 events, pins, and activities.');

  if (shouldDisconnect) {
    await mongoose.disconnect();
  }

  return { users: 4, group: 'Team Alpha', events: createdEvents.length };
}

// Allow direct execution: node src/seed/seed.js
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  seed()
    .then(() => {
      logger.info('Seeding finished.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Seeding failed.');
      process.exit(1);
    });
}
