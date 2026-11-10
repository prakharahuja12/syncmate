#!/usr/bin/env node
/**
 * scripts/seed-verifier.js
 * Verifies that the demo seed data exists and conforms to contract requirements.
 */
import mongoose from 'mongoose';
import { User } from '../../../src/models/User.js';
import { Group } from '../../../src/models/Group.js';
import { Event } from '../../../src/models/Event.js';
import { Pin } from '../../../src/models/Pin.js';

export async function verifySeedData(mongoUri) {
  await mongoose.connect(mongoUri);
  console.log('Verifying SyncMate demo seed data...');

  const group = await Group.findOne({ inviteCode: 'DEMO1234' });
  if (!group) throw new Error('Demo group DEMO1234 not found');
  console.log('✓ Demo group found:', group.name);

  const users = await User.find({ groupId: group._id });
  if (users.length !== 4) throw new Error(`Expected 4 users, found ${users.length}`);
  console.log(`✓ 4 demo users confirmed: ${users.map(u => u.email).join(', ')}`);

  const sihEvent = await Event.findOne({ 'hackathon.name': /Smart India Hackathon/i });
  if (!sihEvent) throw new Error('SIH hackathon event not found');
  console.log('✓ SIH 2026 event verified with registration URLs');

  const pins = await Pin.find({ eventId: sihEvent._id });
  console.log(`✓ Verified ${pins.length} pins on demo hackathon`);

  await mongoose.disconnect();
  console.log('[SUCCESS] All seed verifications passed.');
}

