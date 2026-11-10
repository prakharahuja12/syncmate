import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '../src/features/auth/schema';

describe('Auth Validation Schemas', () => {
  it('validates a correct login payload', () => {
    const valid = loginSchema.safeParse({
      email: 'alex@demo.com',
      password: 'password123',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid email formats', () => {
    const invalid = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(invalid.success).toBe(false);
  });

  it('enforces password minimum length in signup', () => {
    const invalid = signupSchema.safeParse({
      name: 'Alex Demo',
      email: 'alex@demo.com',
      password: 'short',
    });
    expect(invalid.success).toBe(false);
  });

  it('accepts valid signup payload', () => {
    const valid = signupSchema.safeParse({
      name: 'Alex Demo',
      email: 'alex@demo.com',
      password: 'securepassword123',
    });
    expect(valid.success).toBe(true);
  });
});
