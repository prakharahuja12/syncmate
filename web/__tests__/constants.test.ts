import { describe, it, expect } from 'vitest';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  PARTICIPATION_LABELS,
} from '../src/lib/constants';

describe('Web Design Tokens and Constants', () => {
  it('defines exact hex colors for all 6 categories', () => {
    expect(CATEGORY_COLORS.hackathon).toBe('#8E4EC6');
    expect(CATEGORY_COLORS.college).toBe('#3E63DD');
    expect(CATEGORY_COLORS.personal).toBe('#30A46C');
    expect(CATEGORY_COLORS.meeting).toBe('#F5A524');
    expect(CATEGORY_COLORS.competition).toBe('#D6409F');
    expect(CATEGORY_COLORS.other).toBe('#8B8D98');
  });

  it('defines category labels', () => {
    expect(CATEGORY_LABELS.hackathon).toBe('Hackathon');
    expect(CATEGORY_LABELS.college).toBe('College');
  });

  it('defines priority colors matching design tokens', () => {
    expect(PRIORITY_COLORS.high).toBe('#E5484D');
    expect(PRIORITY_COLORS.medium).toBe('#F5A524');
    expect(PRIORITY_COLORS.low).toBe('#30A46C');
  });

  it('defines participation status labels', () => {
    expect(PARTICIPATION_LABELS.interested).toBe('Interested');
    expect(PARTICIPATION_LABELS.planning).toBe('Planning to register');
    expect(PARTICIPATION_LABELS.registered).toBe('Registered');
    expect(PARTICIPATION_LABELS.not_interested).toBe('Not interested');
  });
});
