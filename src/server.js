import http from 'node:http';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initSocket } from './realtime/socket.js';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Create Express app
    const app = createApp();

    // 3. Create HTTP Server
    const server = http.createServer(app);

    // 4. Initialize Socket.IO
    initSocket(server);

    // 5. Start listening
    const PORT = env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`SyncMate Backend listening on port ${PORT} [${env.NODE_ENV}]`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      logger.info(`${signal} signal received: closing HTTP server and database connection`);
      server.close(async () => {
        logger.info('HTTP server closed');
        try {
          await disconnectDB();
          logger.info('Database connection closed cleanly');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, 'Error during database disconnection');
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds timeout
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return { app, server };
  } catch (error) {
    logger.fatal(
      { err: error },
      'Failed to start server. Please ensure MongoDB is running (e.g. docker run -d -p 27017:27017 mongo) or set MONGO_URI in .env'
    );
    process.exit(1);
  }
};

// Start the server if this file is executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { startServer };
