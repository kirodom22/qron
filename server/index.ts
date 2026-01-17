import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { GameManager } from './game/GameManager.js';
import { validatePlayerInput } from './middleware/validation.js';
import { AntiCheat } from './security/AntiCheat.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Get allowed origins from environment or use defaults
const getAllowedOrigins = () => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim());
  }
  // Default origins for development and common deployment platforms
  return [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://qron.netlify.app',
    'https://*.netlify.app'
  ];
};

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? getAllowedOrigins()
      : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for API server
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? getAllowedOrigins()
    : '*',
  credentials: true
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});
app.use('/api', limiter);

// Game manager instance
const gameManager = new GameManager(io);
const antiCheat = new AntiCheat();

// Track online players for real-time stats
let onlinePlayersCount = 0;

// Socket.io connection handling
io.on('connection', (socket) => {
  onlinePlayersCount++;
  console.log(`[CONNECT] Player ${socket.id} connected (Online: ${onlinePlayersCount})`);

  socket.on('join_lobby', async (data) => {
    try {
      const { walletAddress, modeId } = data;

      // Verify wallet address
      if (!walletAddress) {
        socket.emit('error', { message: 'Wallet address required' });
        return;
      }

      // Pass mode ID to game manager (defaults to 'arena' if not specified)
      await gameManager.addPlayerToLobby(socket.id, walletAddress, modeId || 'arena');
      socket.emit('lobby_joined', { playerId: socket.id, modeId: modeId || 'arena' });
    } catch (error) {
      socket.emit('error', { message: (error as Error).message });
    }
  });

  socket.on('player_input', (input) => {
    try {
      // Validate and sanitize input
      const validated = validatePlayerInput(input);

      // Anti-cheat check
      if (!antiCheat.validateInput(socket.id, validated)) {
        console.warn(`[ANTICHEAT] Suspicious activity from ${socket.id}`);
        socket.emit('warning', { message: 'Suspicious activity detected' });
        return;
      }

      gameManager.handlePlayerInput(socket.id, validated);
    } catch (error) {
      console.error('[INPUT ERROR]', error);
    }
  });

  socket.on('disconnect', () => {
    onlinePlayersCount = Math.max(0, onlinePlayersCount - 1);
    console.log(`[DISCONNECT] Player ${socket.id} disconnected (Online: ${onlinePlayersCount})`);
    gameManager.removePlayer(socket.id);
    antiCheat.clearPlayerData(socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), env: process.env.NODE_ENV || 'development' });
});

// Game stats endpoint - for displaying real-time statistics
app.get('/api/stats', (req, res) => {
  const gameStats = gameManager.getStats();
  res.json({
    ...gameStats,
    onlinePlayers: onlinePlayersCount,
    serverTime: Date.now(),
    demoMode: process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'production'
  });
});

// Online players endpoint
app.get('/api/online', (req, res) => {
  res.json({ online: onlinePlayersCount });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[SERVER] Running on port ${PORT}`);
  console.log(`[ENV] ${process.env.NODE_ENV || 'development'}`);
  console.log(`[DEMO] ${process.env.DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
});

