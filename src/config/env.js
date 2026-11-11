import dotenv from 'dotenv';

dotenv.config();

const stripTrailingSlash = (url) => (url ? url.trim().replace(/\/+$/, '') : '');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const webUrl = stripTrailingSlash(
  process.env.WEB_URL || (isProd ? 'https://syncmate-one.vercel.app' : 'http://localhost:5173')
);
const apiUrl = stripTrailingSlash(
  process.env.API_URL || (isProd ? 'https://syncmate-2d9o.onrender.com' : 'http://localhost:5000')
);

const parseCorsOrigins = (raw) => {
  const defaults = isProd
    ? [webUrl, 'https://syncmate-one.vercel.app', 'http://localhost:5173']
    : ['http://localhost:5173'];

  const parsed = raw
    ? raw
        .split(',')
        .map((origin) => stripTrailingSlash(origin))
        .filter(Boolean)
    : defaults;

  if (!parsed.includes('*') && webUrl && !parsed.includes(webUrl)) {
    parsed.push(webUrl);
  }

  return Array.from(new Set(parsed));
};

export const env = {
  NODE_ENV: nodeEnv,
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/syncmate',
  WEB_URL: webUrl,
  API_URL: apiUrl,
  CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGINS),
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_syncmate_minimum_32_characters_long',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_syncmate_minimum_32_characters_long',
  ACCESS_TTL: process.env.ACCESS_TTL || '15m',
  REFRESH_TTL_DAYS: parseInt(process.env.REFRESH_TTL_DAYS || '30', 10),
  MAX_GROUP_MEMBERS: parseInt(process.env.MAX_GROUP_MEMBERS || '5', 10),
  ENCRYPTION_KEY:
    process.env.ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  DISABLE_SCHEDULER: process.env.DISABLE_SCHEDULER === 'true',
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || 'SyncMate <no-reply@syncmate.app>',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI:
    stripTrailingSlash(process.env.GOOGLE_REDIRECT_URI) ||
    `${apiUrl}/api/v1/integrations/google/callback`,
};

/**
 * Checks whether an incoming Origin header is allowed for Express REST & Socket.IO CORS.
 * Normalizes trailing slashes and permits SyncMate Vercel production & preview URLs.
 */
export const isOriginAllowed = (origin, allowedOrigins = env.CORS_ORIGINS) => {
  if (!origin) return true;
  const normalized = stripTrailingSlash(origin);
  if (allowedOrigins.includes('*') || allowedOrigins.includes(normalized)) {
    return true;
  }
  if (/^https:\/\/syncmate-[a-z0-9-]+\.vercel\.app$/i.test(normalized)) {
    return true;
  }
  return false;
};
