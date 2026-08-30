let ioInstance = null;

const initSockets = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

const emitEvent = (eventName, payload) => {
  if (ioInstance) {
    ioInstance.emit(eventName, {
      ...payload,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  initSockets,
  emitEvent
};
