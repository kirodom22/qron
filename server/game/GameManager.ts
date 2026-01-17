import { Server } from 'socket.io';
import { Game } from './Game.js';
import { Player } from './Player.js';

export interface GameModeConfig {
  id: string;
  name: string;
  players: number;
  gridSize: number;
  entryFee: number;
  prize: number;
}

// Default game modes with RESEARCH-OPTIMIZED arena sizes
// Prize pools adjusted for ~10% house edge (verified by Monte Carlo simulation)
// 
// Size formula considerations:
// - Too small → random deaths (bad)
// - Too large → boring chase gameplay (bad)
// - Sweet spot: ~18-20 cells per player for breathing room
//
const GAME_MODES: Record<string, GameModeConfig> = {
  duel: {
    id: 'duel',
    name: '1v1',
    players: 2,
    gridSize: 36,  // Small-Medium: Intimate, tactical
    entryFee: 0.50,
    prize: 0.90    // 10% house edge
  },
  squad: {
    id: 'squad',
    name: 'SQUAD',
    players: 4,
    gridSize: 52,  // Medium: Room for 4-way tactics
    entryFee: 0.50,
    prize: 1.80    // 10% house edge (was 1.40 = 30% edge!)
  },
  ranked: {
    id: 'ranked',
    name: 'RANKED',
    players: 8,
    gridSize: 84,  // Large: Competitive 8-player space
    entryFee: 1.00,
    prize: 7.20    // 10% house edge (was 5.60 = 30% edge!)
  },
  arena: {
    id: 'arena',
    name: 'ARENA',
    players: 10,
    gridSize: 112, // Very Large: Prevents early random deaths
    entryFee: 1.00,
    prize: 9.00    // 10% house edge (was 7.00 = 30% edge!)
  }
};

interface LobbyEntry {
  player: Player;
  modeId: string;
}

export class GameManager {
  private io: Server;
  private games: Map<string, Game> = new Map();
  private lobbies: Map<string, Map<string, Player>> = new Map(); // modeId -> players
  private playerToGame: Map<string, string> = new Map();
  private playerToLobby: Map<string, string> = new Map(); // playerId -> modeId
  private readonly LOBBY_TIMEOUT = 15000; // 15 seconds before filling with bots
  private readonly MIN_WAIT_TIME = 5000; // Minimum 5 seconds wait
  private readonly DEMO_MODE: boolean; // If true, no bots - wait for real players only

  constructor(io: Server) {
    this.io = io;
    // Demo mode: no bots, real players only
    // Set DEMO_MODE=true in environment for development without bots
    this.DEMO_MODE = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'production';

    if (this.DEMO_MODE) {
      console.log('[SERVER] Demo Mode ENABLED - No bots, waiting for real players only');
    }

    // Initialize lobbies for each mode
    Object.keys(GAME_MODES).forEach(modeId => {
      this.lobbies.set(modeId, new Map());
    });
    this.startLobbyCheck();
  }

  async addPlayerToLobby(socketId: string, walletAddress: string, modeId: string = 'arena'): Promise<void> {
    // Validate mode
    const mode = GAME_MODES[modeId];
    if (!mode) {
      console.warn(`[LOBBY] Invalid mode: ${modeId}, defaulting to arena`);
      modeId = 'arena';
    }

    const actualMode = GAME_MODES[modeId];
    const player = new Player(socketId, walletAddress, `RIDER_${Math.floor(Math.random() * 9000) + 1000}`);

    // Get or create lobby for this mode
    let lobby = this.lobbies.get(modeId);
    if (!lobby) {
      lobby = new Map();
      this.lobbies.set(modeId, lobby);
    }

    lobby.set(socketId, player);
    this.playerToLobby.set(socketId, modeId);

    console.log(`[LOBBY] Player ${player.name} joined ${actualMode.name}. Lobby size: ${lobby.size}/${actualMode.players}`);

    // Broadcast lobby update to players in this mode only
    this.broadcastLobbyUpdate(modeId);

    // Start game if we have enough players
    if (lobby.size >= actualMode.players) {
      this.startGame(modeId);
    }
  }

  private broadcastLobbyUpdate(modeId: string): void {
    const mode = GAME_MODES[modeId];
    const lobby = this.lobbies.get(modeId);
    if (!mode || !lobby) return;

    // Notify all players in this lobby
    lobby.forEach((player) => {
      this.io.to(player.id).emit('lobby_update', {
        playersInLobby: lobby.size,
        requiredPlayers: mode.players,
        modeId: modeId,
        modeName: mode.name
      });
    });
  }

  private startGame(modeId: string): void {
    const mode = GAME_MODES[modeId];
    const lobby = this.lobbies.get(modeId);
    if (!mode || !lobby) return;

    const players = Array.from(lobby.values()).slice(0, mode.players);

    if (players.length < 1) return;

    const gameId = `game_${modeId}_${Date.now()}`;
    const game = new Game(gameId, players, this.io, mode);

    this.games.set(gameId, game);

    // Map players to game and remove from lobby
    players.forEach(player => {
      this.playerToGame.set(player.id, gameId);
      lobby.delete(player.id);
      this.playerToLobby.delete(player.id);
    });

    console.log(`[GAME] Starting ${mode.name} game ${gameId} with ${players.length} players on ${mode.gridSize}x${mode.gridSize} grid`);
    game.start();
  }

  handlePlayerInput(socketId: string, input: any): void {
    const gameId = this.playerToGame.get(socketId);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.handlePlayerInput(socketId, input);
  }

  removePlayer(socketId: string): void {
    // Remove from lobby
    const modeId = this.playerToLobby.get(socketId);
    if (modeId) {
      const lobby = this.lobbies.get(modeId);
      if (lobby) {
        lobby.delete(socketId);
        this.broadcastLobbyUpdate(modeId);
      }
      this.playerToLobby.delete(socketId);
    }

    // Remove from active game
    const gameId = this.playerToGame.get(socketId);
    if (gameId) {
      const game = this.games.get(gameId);
      if (game) {
        game.removePlayer(socketId);

        // Clean up finished games
        if (game.isFinished()) {
          this.games.delete(gameId);
        }
      }
      this.playerToGame.delete(socketId);
    }
  }

  private startLobbyCheck(): void {
    setInterval(() => {
      // Check each mode's lobby
      this.lobbies.forEach((lobby, modeId) => {
        const mode = GAME_MODES[modeId];
        if (!mode) return;

        if (lobby.size >= 1 && lobby.size < mode.players) {
          const oldestPlayer = Array.from(lobby.values())[0];
          const waitTime = Date.now() - oldestPlayer.joinedAt;

          // Only log occasionally to reduce spam
          if (waitTime > this.MIN_WAIT_TIME && Math.floor(waitTime / 1000) % 5 === 0) {
            const waitMsg = this.DEMO_MODE
              ? `Waiting for real players...`
              : `Auto-start in ${Math.max(0, Math.ceil((this.LOBBY_TIMEOUT - waitTime) / 1000))}s`;
            console.log(`[LOBBY ${mode.name}] Players: ${lobby.size}/${mode.players}, ${waitMsg}`);
          }

          // In demo mode, never fill with bots - wait indefinitely for real players
          if (!this.DEMO_MODE && waitTime > this.LOBBY_TIMEOUT) {
            console.log(`[LOBBY ${mode.name}] Starting game with bots`);
            this.fillWithBots(modeId);
            this.startGame(modeId);
          }
        }
      });
    }, 3000); // Check every 3 seconds
  }

  private fillWithBots(modeId: string): void {
    const mode = GAME_MODES[modeId];
    const lobby = this.lobbies.get(modeId);
    if (!mode || !lobby) return;

    const botsNeeded = mode.players - lobby.size;

    const botNames = [
      'NEON_PULSE', 'GRID_MASTER', 'SECTOR_7', 'VOID_HUNTER',
      'BYTE_RUNNER', 'APEX_NODE', 'TRON_WOLF', 'CIRCUIT_BREAKER',
      'LASER_EDGE', 'QUANTUM_DRIFT', 'CYBER_HAWK', 'FLASH_ZERO',
      'PIXEL_STORM', 'DATA_BLADE', 'ECHO_PRIME', 'GHOST_RIDER'
    ];

    for (let i = 0; i < botsNeeded; i++) {
      const botId = `bot_${modeId}_${Date.now()}_${i}`;
      const botName = botNames[i % botNames.length];
      const bot = new Player(botId, 'BOT_WALLET', botName, true);
      lobby.set(botId, bot);
    }
  }

  getStats() {
    let totalLobbyPlayers = 0;
    this.lobbies.forEach(lobby => {
      totalLobbyPlayers += lobby.size;
    });

    return {
      activeGames: this.games.size,
      playersInLobby: totalLobbyPlayers,
      totalPlayers: totalLobbyPlayers + Array.from(this.games.values()).reduce((sum, game) => sum + game.getPlayerCount(), 0),
      lobbies: Object.fromEntries(
        Array.from(this.lobbies.entries()).map(([modeId, lobby]) => [modeId, lobby.size])
      )
    };
  }
}
