import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env, isOriginAllowed } from '../config/env.js';
import { logger } from '../config/logger.js';

let io = null;

/**
 * Initializes Socket.IO on the given HTTP server instance.
 *
 * @param {import('node:http').Server} httpServer
 * @returns {Server}
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed by Socket CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication handshake middleware
  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('UNAUTHORIZED: Authentication token missing'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.sub);
      if (!user) {
        return next(new Error('UNAUTHORIZED: User not found'));
      }

      socket.user = user;
      socket.userId = user._id.toString();
      socket.groupId = user.groupId ? user.groupId.toString() : null;
      next();
    } catch {
      return next(new Error('UNAUTHORIZED: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const groupId = socket.groupId;

    logger.debug({ userId, groupId }, 'Socket connected');

    // Auto-join personal room
    socket.join(`user:${userId}`);

    // Auto-join group room if user belongs to a group
    if (groupId) {
      socket.join(`group:${groupId}`);
    }

    // Ping / pong heartbeat ack
    socket.on('ping', (ack) => {
      if (typeof ack === 'function') {
        ack({ pong: true, timestamp: Date.now() });
      } else {
        socket.emit('pong', { timestamp: Date.now() });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.debug({ userId, reason }, 'Socket disconnected');
    });
  });

  return io;
};

/**
 * Returns the active Socket.IO server instance.
 * @returns {Server|null}
 */
export const getIO = () => io;

/**
 * Emits an event to all connected sockets in a group room.
 *
 * @param {string} groupId
 * @param {string} event
 * @param {object} payload
 * @param {object} [options={}]
 * @param {string} [options.exceptUserId]
 */
export const emitToGroup = (groupId, event, payload, { exceptUserId = null } = {}) => {
  if (!io) return;

  const room = `group:${groupId}`;
  if (exceptUserId) {
    io.to(room).except(`user:${exceptUserId}`).emit(event, payload);
  } else {
    io.to(room).emit(event, payload);
  }
};

/**
 * Emits an event to a single user room.
 *
 * @param {string} userId
 * @param {string} event
 * @param {object} payload
 */
export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

/**
 * Moves connected sockets for a user from an old active group room to a new one.
 *
 * @param {string} userId
 * @param {string|null} newGroupId
 * @param {string|null} [oldGroupId]
 */
export const moveUserSocketToGroup = (userId, newGroupId, oldGroupId = null) => {
  if (!io) return;
  const userRoom = io.in(`user:${userId}`);
  if (oldGroupId) {
    userRoom.socketsLeave(`group:${oldGroupId}`);
  }
  if (newGroupId) {
    userRoom.socketsJoin(`group:${newGroupId}`);
  }
};
