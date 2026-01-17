import { create } from 'zustand';
import { socketService } from '../services/socketService';

export interface Player {
  id: string;
  name: string;
  position: { x: number; y: number };
  prevPosition: { x: number; y: number }; // For interpolation
  direction: { dx: number; dy: number };
  trail: { x: number; y: number }[];
  alive: boolean;
  color: string;
  isBot: boolean;
  kills: number;
}

export interface GameMode {
  id: string;
  name: string;
  description: string;
  players: number;
  gridSize: number;
  entryFee: number;
  prize: number;
}

interface GameState {
  gameState: 'MODE_SELECT' | 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'GAME_OVER';
  players: Player[];
  userPlayer: Player | null;
  gridSize: number;
  arenaSize: number;
  potSize: number;
  playersInLobby: number;
  requiredPlayers: number;
  logs: string[];
  rankings: any[];
  gameSpeed: number;
  countdown: number;
  gameStartTime: number;
  selectedMode: GameMode | null;
  // Interpolation timing
  lastServerUpdate: number;
  tickInterval: number;

  // Actions
  initializeSocket: () => void;
  selectMode: (mode: GameMode) => void;
  joinLobby: (walletAddress: string) => void;
  sendInput: (direction: string) => void;
  addLog: (message: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  gameState: 'MODE_SELECT',
  players: [],
  userPlayer: null,
  gridSize: 96,
  arenaSize: 96,
  potSize: 7.00,
  playersInLobby: 0,
  requiredPlayers: 10,
  gameSpeed: 1,
  countdown: 3,
  gameStartTime: 0,
  selectedMode: null,
  lastServerUpdate: 0,
  tickInterval: 50, // Default 20Hz
  logs: [
    '[SYS] LIGHTCYCLE_ARENA INITIALIZED',
    '[SYS] CONNECTED TO GAME_SERVER',
    '[SYS] READY FOR MODE SELECTION...'
  ],
  rankings: [],

  initializeSocket: () => {
    socketService.connect();

    socketService.on('lobby_joined', (data) => {
      get().addLog(`CONNECTED AS ${data.playerId}`);
    });

    socketService.on('lobby_update', (data) => {
      set({
        playersInLobby: data.playersInLobby,
        requiredPlayers: data.requiredPlayers
      });
      get().addLog(`LOBBY: ${data.playersInLobby}/${data.requiredPlayers} PLAYERS`);
    });

    socketService.on('game_start', (data) => {
      const userPlayer = data.players.find((p: Player) => p.id === socketService.getSocketId());

      // Initialize prevPosition for all players
      const playersWithPrev = data.players.map((p: any) => ({
        ...p,
        prevPosition: p.prevPosition || { ...p.position }
      }));

      set({
        gameState: 'COUNTDOWN',
        players: playersWithPrev,
        userPlayer,
        gridSize: data.gridSize,
        arenaSize: data.arenaSize,
        countdown: 3,
        gameStartTime: Date.now(),
        lastServerUpdate: Date.now()
      });

      if (data.prizePool) {
        set({ potSize: data.prizePool });
      }

      get().addLog(`GAME STARTING - ${data.modeName || 'ARENA'}`);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        const current = get().countdown;
        if (current > 1) {
          set({ countdown: current - 1 });
          get().addLog(`COUNTDOWN: ${current - 1}`);
        } else {
          clearInterval(countdownInterval);
          set({ gameState: 'PLAYING' });
          get().addLog('GAME STARTED - LIGHTCYCLES DEPLOYED');
        }
      }, 1000);
    });

    socketService.on('game_state', (data) => {
      const now = Date.now();

      set(state => {
        // Update players with interpolation data
        const updatedPlayers = state.players.map(p => {
          const update = data.players.find((u: any) => u.id === p.id);
          if (update) {
            return {
              ...p,
              // Store previous position for interpolation
              prevPosition: update.prevPosition || p.position,
              position: update.position,
              direction: update.direction || p.direction,
              alive: update.alive,
              trail: update.trail || p.trail
            };
          }
          return p;
        });

        return {
          players: updatedPlayers,
          arenaSize: data.arenaSize,
          gameSpeed: data.gameSpeed || 1,
          lastServerUpdate: now,
          tickInterval: data.tickInterval || 50
        };
      });
    });

    socketService.on('speed_boost', (data) => {
      get().addLog(`SPEED INCREASED TO ${data.newSpeed.toFixed(1)}X`);
    });

    socketService.on('arena_phase', (data) => {
      const messages: Record<string, string> = {
        warning: 'ARENA CONTRACTING - STAY ALERT',
        danger: 'DANGER ZONE - ARENA CRITICAL',
        panic: 'FINAL CONVERGENCE - SURVIVE!'
      };
      if (messages[data.phase]) {
        get().addLog(messages[data.phase]);
      }
    });

    socketService.on('near_collision', () => {
      get().addLog('NEAR MISS!');
    });

    socketService.on('last_stand', (data) => {
      get().addLog(data.message);
    });

    socketService.on('player_eliminated', (data) => {
      get().addLog(`${data.playerName} ELIMINATED (${data.survivalTime}s)`);

      set(state => ({
        players: state.players.map(p =>
          p.id === data.playerId ? { ...p, alive: false } : p
        )
      }));
    });

    socketService.on('game_end', (data) => {
      set({
        gameState: 'GAME_OVER',
        rankings: data.rankings
      });

      get().addLog('GAME ENDED - SETTLEMENT COMPLETE');
    });

    socketService.on('error', (data) => {
      get().addLog(`ERROR: ${data.message}`);
    });
  },

  selectMode: (mode: GameMode) => {
    set({
      selectedMode: mode,
      gameState: 'LOBBY',
      gridSize: mode.gridSize,
      arenaSize: mode.gridSize,
      requiredPlayers: mode.players,
      potSize: mode.prize
    });
    get().addLog(`MODE SELECTED: ${mode.name}`);
  },

  joinLobby: (walletAddress: string) => {
    const mode = get().selectedMode;
    socketService.emit('join_lobby', {
      walletAddress,
      modeId: mode?.id || 'arena'
    });
  },

  sendInput: (direction: string) => {
    socketService.emit('player_input', { direction, timestamp: Date.now() });
  },

  addLog: (message: string) => {
    set(state => ({
      logs: [
        `[${new Date().toLocaleTimeString()}] ${message}`,
        ...state.logs
      ].slice(0, 12)
    }));
  },

  resetGame: () => {
    set({
      gameState: 'MODE_SELECT',
      players: [],
      userPlayer: null,
      arenaSize: 96,
      gameSpeed: 1,
      countdown: 3,
      gameStartTime: 0,
      rankings: [],
      selectedMode: null,
      lastServerUpdate: 0
    });
  }
}));
