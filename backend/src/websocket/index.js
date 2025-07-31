// backend/src/websocket/index.js
const { Server } = require('socket.io');
const config = require('../config');
const logger = require('../utils/logger');

let io = null;

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware for WebSocket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // TODO: Verify JWT token and get user info
      // const decoded = jwt.verify(token, config.jwt.secret);
      // socket.userId = decoded.id;
      // socket.clientId = decoded.clientId;
      
      // For now, just allow connection
      socket.userId = 'temp-user';
      socket.clientId = 'temp-client';
      
      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`, {
      userId: socket.userId,
      clientId: socket.clientId,
      remoteAddress: socket.request.connection.remoteAddress
    });

    // Join client-specific room for targeted updates
    socket.join(`client:${socket.clientId}`);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Handle real-time events
    socket.on('subscribe_analytics', (data) => {
      logger.info('Client subscribed to analytics updates', {
        socketId: socket.id,
        userId: socket.userId,
        clientId: socket.clientId,
        filters: data.filters
      });
      
      socket.join(`analytics:${socket.clientId}`);
    });

    socket.on('subscribe_journey', (data) => {
      logger.info('Client subscribed to journey updates', {
        socketId: socket.id,
        userId: socket.userId,
        clientId: socket.clientId,
        journeyId: data.journeyId
      });
      
      socket.join(`journey:${data.journeyId}`);
    });

    socket.on('subscribe_abtest', (data) => {
      logger.info('Client subscribed to A/B test updates', {
        socketId: socket.id,
        userId: socket.userId,
        clientId: socket.clientId,
        testId: data.testId
      });
      
      socket.join(`abtest:${data.testId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id}`, {
        reason,
        userId: socket.userId,
        clientId: socket.clientId
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error:', {
        socketId: socket.id,
        userId: socket.userId,
        clientId: socket.clientId,
        error: error.message
      });
    });
  });

  logger.info('WebSocket server initialized');
  return io;
};

// Utility functions for emitting events
const socketUtils = {
  // Emit to specific client
  emitToClient: (clientId, event, data) => {
    if (io) {
      io.to(`client:${clientId}`).emit(event, data);
      logger.debug('WebSocket event emitted to client', {
        clientId,
        event,
        dataSize: JSON.stringify(data).length
      });
    }
  },

  // Emit to specific user
  emitToUser: (userId, event, data) => {
    if (io) {
      io.to(`user:${userId}`).emit(event, data);
      logger.debug('WebSocket event emitted to user', {
        userId,
        event,
        dataSize: JSON.stringify(data).length
      });
    }
  },

  // Emit analytics update
  emitAnalyticsUpdate: (clientId, data) => {
    if (io) {
      io.to(`analytics:${clientId}`).emit('analytics_update', data);
    }
  },

  // Emit journey update
  emitJourneyUpdate: (journeyId, data) => {
    if (io) {
      io.to(`journey:${journeyId}`).emit('journey_update', data);
    }
  },

  // Emit A/B test update
  emitABTestUpdate: (testId, data) => {
    if (io) {
      io.to(`abtest:${testId}`).emit('abtest_update', data);
    }
  },

  // Emit notification
  emitNotification: (clientId, notification) => {
    if (io) {
      io.to(`client:${clientId}`).emit('notification', {
        id: require('uuid').v4(),
        timestamp: new Date().toISOString(),
        ...notification
      });
    }
  },

  // Broadcast to all connected clients (admin only)
  broadcast: (event, data) => {
    if (io) {
      io.emit(event, data);
      logger.info('WebSocket broadcast sent', { event });
    }
  },

  // Get connection stats
  getConnectionStats: () => {
    if (!io) return null;
    
    return {
      connectedSockets: io.engine.clientsCount,
      rooms: Object.keys(io.sockets.adapter.rooms).length
    };
  }
};

module.exports = {
  initializeWebSocket,
  socketUtils,
  getIO: () => io
};