import { Game } from './Game.js';
import { Player, Position } from './Player.js';

export class BotAI {
  private game: Game;
  private readonly LOOK_AHEAD = 5;
  private readonly DANGER_THRESHOLD = 3;
  private tickCounter: number = 0;
  private readonly BOT_THINK_INTERVAL = 3; // Only reconsider direction every 3 ticks

  constructor(game: Game) {
    this.game = game;
  }

  updateBots(): void {
    this.tickCounter++;
    const players = this.game.getPlayers();

    players.forEach(player => {
      if (!player.isBot || !player.alive) return;

      // Throttle bot decisions for performance
      // Each bot has a slight offset to spread CPU load
      const botOffset = parseInt(player.id.split('_').pop() || '0') % this.BOT_THINK_INTERVAL;
      if ((this.tickCounter + botOffset) % this.BOT_THINK_INTERVAL !== 0) return;

      const bestDirection = this.calculateBestDirection(player);
      if (bestDirection) {
        player.setDirection(bestDirection.dx, bestDirection.dy);
      }
    });
  }

  private calculateBestDirection(bot: Player): { dx: number; dy: number } | null {
    const possibleDirections = [
      { dx: 0, dy: -1 }, // Up
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 }   // Right
    ];

    // Filter out 180-degree turns
    const validDirections = possibleDirections.filter(dir =>
      bot.direction.dx + dir.dx !== 0 || bot.direction.dy + dir.dy !== 0
    );

    // Score each direction
    const scoredDirections = validDirections.map(dir => ({
      ...dir,
      score: this.scoreDirection(bot, dir)
    }));

    // Sort by score (higher is better)
    scoredDirections.sort((a, b) => b.score - a.score);

    // Return best direction if it's safe
    if (scoredDirections.length > 0 && scoredDirections[0].score > 0) {
      return scoredDirections[0];
    }

    return null;
  }

  private scoreDirection(bot: Player, direction: { dx: number; dy: number }): number {
    let score = 100;
    const { x, y } = bot.position;

    // Check immediate collision
    const nextX = x + direction.dx;
    const nextY = y + direction.dy;

    if (this.isCollision(nextX, nextY)) {
      return -1000; // Immediate death
    }

    // Look ahead for danger
    let currentX = nextX;
    let currentY = nextY;

    for (let i = 1; i <= this.LOOK_AHEAD; i++) {
      currentX += direction.dx;
      currentY += direction.dy;

      if (this.isCollision(currentX, currentY)) {
        score -= (this.LOOK_AHEAD - i + 1) * 20; // Closer danger = worse score
        break;
      }
    }

    // Prefer center of arena
    const center = this.game.getGridSize() / 2;
    const distanceToCenter = Math.abs(nextX - center) + Math.abs(nextY - center);
    score -= distanceToCenter * 0.5;

    // Avoid edges of shrinking arena
    const limit = (this.game.getGridSize() - this.game.getArenaSize()) / 2;
    const distanceToEdge = Math.min(
      nextX - limit,
      nextY - limit,
      this.game.getGridSize() - limit - nextX,
      this.game.getGridSize() - limit - nextY
    );

    if (distanceToEdge < this.DANGER_THRESHOLD) {
      score -= (this.DANGER_THRESHOLD - distanceToEdge) * 30;
    }

    // Prefer open space
    const openSpace = this.countOpenSpace(nextX, nextY);
    score += openSpace * 2;

    return score;
  }

  private isCollision(x: number, y: number): boolean {
    const limit = (this.game.getGridSize() - this.game.getArenaSize()) / 2;

    // Check boundaries
    if (x < limit || x >= this.game.getGridSize() - limit ||
      y < limit || y >= this.game.getGridSize() - limit) {
      return true;
    }

    // Check trails
    for (const player of this.game.getPlayers().values()) {
      for (const segment of player.trail) {
        if (segment.x === x && segment.y === y) {
          return true;
        }
      }
    }

    return false;
  }

  private countOpenSpace(x: number, y: number): number {
    let openCount = 0;
    const checkRadius = 3;

    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        if (!this.isCollision(x + dx, y + dy)) {
          openCount++;
        }
      }
    }

    return openCount;
  }
}
