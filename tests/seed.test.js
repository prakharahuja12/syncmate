import bcrypt from 'bcryptjs';
import { seed } from '../src/seed/seed.js';
import { User } from '../src/models/User.js';
import { Group } from '../src/models/Group.js';
import { Event } from '../src/models/Event.js';
import { Pin } from '../src/models/Pin.js';
import { Participation } from '../src/models/Participation.js';

describe('Demo Database Seeder (Phase 9)', () => {
  it('seeds database idempotently with 4 users, group DEMO1234, and SIH 2026', async () => {
    // 1. Initial seed run
    const result = await seed();
    expect(result.users).toBe(4);
    expect(result.group).toBe('Team Alpha');
    expect(result.events).toBe(25);

    // Verify group
    const group = await Group.findOne({ inviteCode: 'DEMO1234' });
    expect(group).not.toBeNull();
    expect(group.name).toBe('Team Alpha');
    expect(group.members).toHaveLength(4);

    // Verify users & password
    const users = await User.find({ groupId: group._id });
    expect(users).toHaveLength(4);
    for (const u of users) {
      const isMatch = await bcrypt.compare('Demo@1234', u.passwordHash);
      expect(isMatch).toBe(true);
    }

    // Verify SIH 2026 hackathon
    const sihEvent = await Event.findOne({ 'hackathon.name': 'Smart India Hackathon 2026' });
    expect(sihEvent).not.toBeNull();
    expect(sihEvent.category).toBe('hackathon');
    expect(sihEvent.hackathon.registrationUrl).toBe('https://sih.gov.in/register');

    // Verify pins & participations
    const pins = await Pin.find({ eventId: sihEvent._id });
    expect(pins).toHaveLength(2);

    const parts = await Participation.find({ eventId: sihEvent._id });
    expect(parts.length).toBeGreaterThanOrEqual(3);

    // 2. Second seed run must be strictly idempotent (no duplicates or crashes)
    const secondResult = await seed();
    expect(secondResult.users).toBe(4);
    expect(secondResult.events).toBe(25);

    const updatedGroup = await Group.findOne({ inviteCode: 'DEMO1234' });
    const usersAfter = await User.find({ groupId: updatedGroup._id });
    expect(usersAfter).toHaveLength(4);
  });
});
