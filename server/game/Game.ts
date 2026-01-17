import { Server } from 'socket.io';
import { Player, Position } from './Player.js';
import { BotAI } from './BotAI.js';
import { GameModeConfig } from './GameManager.js';

export class Game {
  id: string;
  players: Map<string, Player>;
  io: Server;
  tickRate: number = 20; // 20Hz tick rate - smooth movement with proper pacing
  gridSize: number;
  arenaSize: number;
  shrinkRate: number;
  gameLoop: NodeJS.Timeout | null = null;
  state: 'waiting' | 'active' | 'finished' = 'waiting';
  startTime: number = 0;
  botAI: BotAI;
  gameSpeed: number = 0.3; // Start slow (0.3), build up to max 0.7
  tickCounter: number = 0;
  shrinkPhase: 'stable' | 'warning' | 'danger' | 'panic' = 'stable';
  mode: GameModeConfig;
  lastBroadcastTime: number = 0;
  readonly BROADCAST_INTERVAL = 25; // ~40 fps broadcast for smooth interpolation
  lastTickTime: number = 0;
  lastSpeedIncreaseTime: number = 0; // For progressive speed
  readonly MIN_SPEED = 0.3;
  readonly MAX_SPEED = 0.7;
  readonly SPEED_INCREASE_INTERVAL = 5000; // Increase speed every 5 seconds
  readonly SPEED_INCREMENT = 0.05; // Small increments for smooth acceleration

  constructor(id: string, players: Player[], io: Server, mode: GameModeConfig) {
    this.id = id;
    this.io = io;
    this.mode = mode;
    this.players = new Map(players.map(p => [p.id, p]));
    this.botAI = new BotAI(this);

    // Use mode-specific settings
    this.gridSize = mode.gridSize;
    this.arenaSize = mode.gridSize;

    // Shrink rate tuned for research-optimized arena sizes
    this.shrinkRate = mode.gridSize <= 40 ? 0.002 :   // 1v1 - slower shrink
      mode.gridSize <= 55 ? 0.003 :                    // Squad
        mode.gridSize <= 90 ? 0.004 :                  // Ranked
          0.005;                                        // Arena

    // 20Hz tick rate - proven to feel smooth with interpolation
    // At 0.3 speed, player moves ~6 cells/sec (strategic pace)
    // At 0.7 speed, player moves ~14 cells/sec (intense finale)
    this.tickRate = 20;
    this.gameSpeed = this.MIN_SPEED; // Always start slow

    this.initializePlayerPositions();
  }

  private initializePlayerPositions(): void {
    const playerArray = Array.from(this.players.values());
    const angleStep = (2 * Math.PI) / playerArray.length;
    const spawnRadius = this.gridSize * 0.35; // Slightly closer to center
    const center = this.gridSize / 2;

    playerArray.forEach((player, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const x = Math.floor(center + Math.cos(angle) * spawnRadius);
      const y = Math.floor(center + Math.sin(angle) * spawnRadius);

      player.setPosition(x, y);
      player.addTrailSegment();

      // Set initial direction towards center
      const dx = center - x;
      const dy = center - y;

      if (Math.abs(dx) > Math.abs(dy)) {
        player.setDirection(dx > 0 ? 1 : -1, 0);
      } else {
        player.setDirection(0, dy > 0 ? 1 : -1);
      }
    });
  }

  start(): void {
    this.state = 'waiting';
    this.startTime = Date.now();

    // Notify all players with mode-specific info
    this.broadcast('game_start', {
      gameId: this.id,
      players: Array.from(this.players.values()).map(p => p.toJSON()),
      gridSize: this.gridSize,
      arenaSize: this.arenaSize,
      modeName: this.mode.name,
      modeId: this.mode.id,
      prizePool: this.mode.prize
    });

    console.log(`[GAME ${this.id}] Countdown started for ${this.mode.name}...`);
    setTimeout(() => {
      this.state = 'active';
      this.lastSpeedIncreaseTime = Date.now(); // Initialize speed timer
      this.gameSpeed = this.MIN_SPEED; // Ensure we start at minimum speed
      console.log(`[GAME ${this.id}] ${this.mode.name} game loop started at speed ${this.gameSpeed}!`);
      this.gameLoop = setInterval(() => this.tick(), 1000 / this.tickRate);
    }, 3500);
  }

  private tick(): void {
    if (this.state !== 'active') return;

    this.tickCounter++;
    const now = Date.now();

    // Progressive speed increase - builds tension over time
    // Speed increases every 5 seconds, ensuring matches last 30+ seconds
    if (now - this.lastSpeedIncreaseTime >= this.SPEED_INCREASE_INTERVAL) {
      this.lastSpeedIncreaseTime = now;
      const oldSpeed = this.gameSpeed;
      this.gameSpeed = Math.min(this.MAX_SPEED, this.gameSpeed + this.SPEED_INCREMENT);

      if (this.gameSpeed !== oldSpeed) {
        this.broadcast('speed_boost', { newSpeed: this.gameSpeed });
        console.log(`[GAME ${this.id}] Speed increased to ${this.gameSpeed.toFixed(2)}`);
      }
    }

    // Update bot AI (throttled for performance)
    if (this.tickCounter % 2 === 0) {
      this.botAI.updateBots();
    }

    // Move players
    this.players.forEach(player => {
      if (!player.alive) return;

      player.subStep += this.gameSpeed;

      while (player.subStep >= 1.0) {
        player.subStep -= 1.0;

        const nextX = player.position.x + player.direction.dx;
        const nextY = player.position.y + player.direction.dy;

        if (this.checkCollision(nextX, nextY, player.id)) {
          this.eliminatePlayer(player.id);
          return;
        }

        if (this.checkNearMiss(nextX, nextY, player.id)) {
          this.io.to(player.id).emit('near_collision', {});
        }

        player.setPosition(nextX, nextY);
        player.addTrailSegment();
        player.survivalTime = this.tickCounter;
      }
    });

    // Shrink arena
    this.updateArenaShrink();

    // Throttled broadcast for performance
    if (now - this.lastBroadcastTime >= this.BROADCAST_INTERVAL) {
      this.broadcastGameState();
      this.lastBroadcastTime = now;
    }

    // Check win condition based on mode
    const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);
    const winCondition = this.mode.players <= 2 ? 1 :
      this.mode.players <= 4 ? 1 :
        3; // Top 3 for larger modes

    if (alivePlayers.length <= winCondition) {
      this.endGame();
    }
  }

  private updateArenaShrink(): void {
    const minSize = this.gridSize * 0.25; // Minimum 25% of original size
    this.arenaSize = Math.max(this.arenaSize - this.shrinkRate, minSize);

    const oldPhase = this.shrinkPhase;
    const percentage = (this.arenaSize / this.gridSize) * 100;

    if (percentage < 30) {
      this.shrinkPhase = 'panic';
    } else if (percentage < 50) {
      this.shrinkPhase = 'danger';
    } else if (percentage < 70) {
      this.shrinkPhase = 'warning';
    } else {
      this.shrinkPhase = 'stable';
    }

    if (oldPhase !== this.shrinkPhase) {
      this.broadcast('arena_phase', { phase: this.shrinkPhase });
      console.log(`[GAME ${this.id}] Arena phase: ${this.shrinkPhase}`);
    }
  }

  private checkNearMiss(x: number, y: number, playerId: string): boolean {
    for (const player of this.players.values()) {
      if (player.id === playerId || !player.alive) continue;

      const distance = Math.abs(player.position.x - x) + Math.abs(player.position.y - y);
      if (distance <= 2) {
        return true;
      }
    }
    return false;
  }

  private checkCollision(x: number, y: number, playerId: string): boolean {
    const limit = (this.gridSize - this.arenaSize) / 2;
    if (x < limit || x >= this.gridSize - limit || y < limit || y >= this.gridSize - limit) {
      return true;
    }

    for (const player of this.players.values()) {
      for (const segment of player.trail) {
        if (segment.x === x && segment.y === y) {
          return true;
        }
      }
    }

    return false;
  }

  private eliminatePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    player.eliminate();

    const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);

    this.broadcast('player_eliminated', {
      playerId,
      playerName: player.name,
      remainingPlayers: alivePlayers.length,
      survivalTime: Math.floor(player.survivalTime / this.tickRate)
    });

    // Announce when reaching prize positions
    if (alivePlayers.length === 3 && this.mode.players > 4) {
      this.broadcast('last_stand', { message: 'TOP 3 - PRIZE POSITIONS' });
    } else if (alivePlayers.length === 2 && this.mode.players <= 4) {
      this.broadcast('last_stand', { message: 'FINAL SHOWDOWN' });
    }

    console.log(`[GAME ${this.id}] ${player.name} eliminated after ${Math.floor(player.survivalTime / this.tickRate)}s`);
  }

  private endGame(): void {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }

    this.state = 'finished';

    const rankings = Array.from(this.players.values())
      .sort((a, b) => {
        if (a.alive && !b.alive) return -1;
        if (!a.alive && b.alive) return 1;
        return b.survivalTime - a.survivalTime;
      });

    const gameDuration = Math.floor((Date.now() - this.startTime) / 1000);

    this.broadcast('game_end', {
      gameId: this.id,
      gameDuration,
      modeName: this.mode.name,
      prizePool: this.mode.prize,
      rankings: rankings.map((p, index) => ({
        rank: index + 1,
        playerId: p.id,
        playerName: p.name,
        alive: p.alive,
        kills: p.kills,
        survivalTime: Math.floor(p.survivalTime / this.tickRate),
        prize: this.calculatePrize(index)
      }))
    });

    console.log(`[GAME ${this.id}] ${this.mode.name} finished in ${gameDuration}s`);
  }

  private calculatePrize(rank: number): number {
    const totalPrize = this.mode.prize;

    // Prize distribution based on mode size
    if (this.mode.players <= 2) {
      // 1v1: Winner takes all (minus platform fee already deducted in prize)
      return rank === 0 ? totalPrize : 0;
    } else if (this.mode.players <= 4) {
      // Squad: 1st gets 75%, 2nd gets 25%
      const distribution = [0.75, 0.25];
      return rank < distribution.length ? totalPrize * distribution[rank] : 0;
    } else {
      // Ranked/Arena: Top 3 split
      // 1st: 69.4%, 2nd: 20.8%, 3rd: 9.8%
      const distribution = [0.694, 0.208, 0.098];
      return rank < distribution.length ? totalPrize * distribution[rank] : 0;
    }
  }

  handlePlayerInput(playerId: string, input: any): void {
    const player = this.players.get(playerId);
    if (!player || !player.alive || player.isBot) return;

    const { direction } = input;

    if (direction === 'up' && player.direction.dy === 0) {
      player.setDirection(0, -1);
    } else if (direction === 'down' && player.direction.dy === 0) {
      player.setDirection(0, 1);
    } else if (direction === 'left' && player.direction.dx === 0) {
      player.setDirection(-1, 0);
    } else if (direction === 'right' && player.direction.dx === 0) {
      player.setDirection(1, 0);
    }

    player.lastInputTime = Date.now();
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player && player.alive) {
      this.eliminatePlayer(playerId);
    }
  }

  private broadcastGameState(): void {
    const now = Date.now();
    const tickInterval = 1000 / this.tickRate;

    // Send interpolation data for buttery smooth rendering
    this.broadcast('game_state', {
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        position: p.position,
        prevPosition: p.prevPosition,
        direction: p.direction,
        alive: p.alive,
        trail: p.trail
      })),
      arenaSize: this.arenaSize,
      gameSpeed: this.gameSpeed,
      shrinkPhase: this.shrinkPhase,
      // Timing info for client-side interpolation
      serverTime: now,
      tickInterval: tickInterval
    });
  }

  private broadcast(event: string, data: any): void {
    this.players.forEach(player => {
      if (!player.isBot) {
        this.io.to(player.id).emit(event, data);
      }
    });
  }

  isFinished(): boolean {
    return this.state === 'finished';
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  getPlayers(): Map<string, Player> {
    return this.players;
  }

  getArenaSize(): number {
    return this.arenaSize;
  }

  getGridSize(): number {
    return this.gridSize;
  }
}
