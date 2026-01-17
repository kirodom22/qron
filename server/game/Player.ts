export interface Position {
  x: number;
  y: number;
}

export interface Direction {
  dx: number;
  dy: number;
}

export class Player {
  id: string;
  walletAddress: string;
  name: string;
  position: Position;
  prevPosition: Position; // For client-side interpolation
  direction: Direction;
  trail: Position[] = [];
  alive: boolean = true;
  color: string;
  isBot: boolean;
  joinedAt: number;
  kills: number = 0;
  lastInputTime: number = 0;
  subStep: number = 0;
  trailDelay: number = 2;
  survivalTime: number = 0;
  lastMoveTime: number = 0; // Timestamp of last movement for interpolation

  constructor(id: string, walletAddress: string, name: string, isBot: boolean = false) {
    this.id = id;
    this.walletAddress = walletAddress;
    this.name = name;
    this.isBot = isBot;
    this.joinedAt = Date.now();

    // Initial positions
    this.position = { x: 0, y: 0 };
    this.prevPosition = { x: 0, y: 0 };
    this.direction = { dx: 1, dy: 0 };
    this.lastMoveTime = Date.now();

    // Assign color
    this.color = this.getRandomColor();
  }

  private getRandomColor(): string {
    const colors = [
      '#00f7ff', '#ff00ff', '#ffff00', '#00ff00',
      '#ff6b00', '#ff0066', '#00ffff', '#9d00ff',
      '#ff3366', '#33ff66', '#6633ff', '#ff9933',
      '#33ffff', '#ff33ff', '#99ff33', '#ff3399'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  setPosition(x: number, y: number): void {
    // Store previous position for interpolation
    this.prevPosition = { ...this.position };
    this.position = { x, y };
    this.lastMoveTime = Date.now();
  }

  setDirection(dx: number, dy: number): void {
    // Prevent 180-degree turns
    if (this.direction.dx + dx !== 0 || this.direction.dy + dy !== 0) {
      this.direction = { dx, dy };
    }
  }

  addTrailSegment(): void {
    // PERMANENT TRAILS - Core TRON mechanic
    if (this.trail.length >= this.trailDelay) {
      this.trail.push({ ...this.position });
    } else {
      this.trail.push({ ...this.position });
    }
  }

  eliminate(): void {
    this.alive = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      prevPosition: this.prevPosition,
      direction: this.direction,
      trail: this.trail,
      alive: this.alive,
      color: this.color,
      isBot: this.isBot,
      kills: this.kills,
      survivalTime: this.survivalTime,
      lastMoveTime: this.lastMoveTime
    };
  }
}
