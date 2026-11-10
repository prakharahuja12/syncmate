import dotenv from 'dotenv';

dotenv.config();

const parseCorsOrigins = (raw) => {
  if (!raw) return ['http://localhost:5173'];
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/syncmate',
  WEB_URL: process.env.WEB_URL || 'http://localhost:5173',
  API_URL: process.env.API_URL || 'http://localhost:5000',
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
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:5000/api/v1/integrations/google/callback',
};
