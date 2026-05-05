require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const groupRoutes = require('./routes/groups');
const splitSocket = require('./socket/splitSocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/groups', groupRoutes);

// Socket.io
splitSocket(io);

// Start Server and Database
async function startServer() {
  try {
    let mongoUri = process.env.MONGO_URI;

    // Si no hay URI o falla, usar memoria (perfecto para desarrollo rápido)
    if (!mongoUri || mongoUri.includes('localhost')) {
      console.log('Starting MongoDB Memory Server...');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
  }
}

startServer();
