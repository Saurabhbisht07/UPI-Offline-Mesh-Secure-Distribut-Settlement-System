const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });
dotenv.config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { initSockets } = require('./sockets/socketHandler');
const demoService = require('./services/demoService');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

initSockets(io);

async function startServer() {
  await connectDB();
  await demoService.seedAccounts();

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 UPI Offline Mesh Server running on port ${PORT}`);
    console.log(`🌐 REST API: http://localhost:${PORT}/api`);
    console.log(`🔌 WebSockets: ws://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer();

module.exports = server;
