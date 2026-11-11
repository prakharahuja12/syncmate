import request from 'supertest';
import { createApp } from '../src/app.js';
import { isOriginAllowed } from '../src/config/env.js';

describe('CORS & Vercel-Render Connectivity', () => {
  const app = createApp();

  it('allows the Vercel production origin and Vercel preview origins', () => {
    expect(isOriginAllowed('https://syncmate-one.vercel.app', ['https://syncmate-one.vercel.app'])).toBe(true);
    expect(isOriginAllowed('https://syncmate-one.vercel.app/', ['https://syncmate-one.vercel.app'])).toBe(true);
    expect(isOriginAllowed('https://syncmate-git-main.vercel.app', ['https://syncmate-one.vercel.app'])).toBe(true);
    expect(isOriginAllowed(undefined, ['https://syncmate-one.vercel.app'])).toBe(true);
  });

  it('blocks unrelated third-party origins when wildcard is disabled', () => {
    expect(isOriginAllowed('https://evil.example.com', ['https://syncmate-one.vercel.app'])).toBe(false);
  });

  it('returns Access-Control-Allow-Origin matching Vercel frontend origin on /health', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://syncmate-one.vercel.app');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://syncmate-one.vercel.app');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});

