import { loginSchema, signupSchema } from '../src/features/auth/schema';
import { eventFormSchema } from '../src/features/events/schema';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    test('validates correct email and password', () => {
      const valid = { email: 'alex@demo.com', password: 'password123' };
      const parsed = loginSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    test('rejects short passwords', () => {
      const invalid = { email: 'alex@demo.com', password: '123' };
      const parsed = loginSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    test('rejects invalid email formats', () => {
      const invalid = { email: 'notanemail', password: 'password123' };
      const parsed = loginSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    test('validates full signup data', () => {
      const valid = { name: 'Alex Rivers', email: 'alex@syncmate.dev', password: 'securePassword1' };
      const parsed = signupSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    test('requires minimum 2 characters for name', () => {
      const invalid = { name: 'A', email: 'alex@syncmate.dev', password: 'securePassword1' };
      const parsed = signupSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('eventFormSchema', () => {
    test('validates event creation payload', () => {
      const valid = {
        title: 'Smart India Hackathon',
        category: 'hackathon',
        priority: 'high',
        startAt: '2026-11-15T09:00:00.000Z',
        endAt: '2026-11-16T18:00:00.000Z',
        allDay: false,
        url: 'https://sih.gov.in',
      };
      const parsed = eventFormSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    test('rejects missing title', () => {
      const invalid = {
        title: '',
        category: 'meeting',
        priority: 'low',
        startAt: '2026-11-15T09:00:00.000Z',
        endAt: '2026-11-16T18:00:00.000Z',
      };
      const parsed = eventFormSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });
});

