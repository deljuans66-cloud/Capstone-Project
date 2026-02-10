import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import platformRoutes from './routes/platforms.js';
import gameRoutes from './routes/games.js';
import groupRoutes from './routes/groups.js';
import messageRoutes from './routes/messages.js';
import userRoutes from './routes/users.js';
import { setupSocketHandlers } from './socket/index.js';
import { cleanupExpiredGroups } from './routes/groups.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Setup WebSocket handlers
setupSocketHandlers(io);

// Cleanup expired groups every hour
setInterval(async () => {
  try {
    await cleanupExpiredGroups(io);
  } catch (err) {
    console.error('Error cleaning up expired groups:', err);
  }
}, 60 * 60 * 1000); // Every hour

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
