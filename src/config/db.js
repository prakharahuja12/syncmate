import mongoose from 'mongoose';
import { logger } from './logger.js';
import { env } from './env.js';

let isConnected = false;

export const connectDB = async (uri = env.MONGO_URI) => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });
    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection error');
    throw error;
  }
};

export const disconnectDB = async () => {
  if (!isConnected && mongoose.connection.readyState === 0) {
    return;
  }
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB Disconnected');
};

mongoose.connection.on('error', (err) => {
  logger.error({ err }, 'MongoDB runtime error');
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected');
});
