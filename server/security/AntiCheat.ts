interface InputHistory {
  timestamp: number;
  direction: string;
}

interface PlayerData {
  inputHistory: InputHistory[];
  lastPosition: { x: number; y: number } | null;
  warningCount: number;
  flagged: boolean;
}

export class AntiCheat {
  private playerData: Map<string, PlayerData> = new Map();
  private readonly MAX_WARNINGS = 3;
  private readonly MIN_INPUT_DELAY = 50; // milliseconds
  private readonly MAX_SPEED = 2; // pixels per tick

  validateInput(playerId: string, input: any): boolean {
    if (!this.playerData.has(playerId)) {
      this.playerData.set(playerId, {
        inputHistory: [],
        lastPosition: null,
        warningCount: 0,
        flagged: false
      });
    }

    const data = this.playerData.get(playerId)!;

    // Check if player is already flagged
    if (data.flagged) {
      return false;
    }

    // Validate input timing
    if (!this.validateInputTiming(data, input)) {
      this.flagPlayer(playerId, 'RAPID_INPUT');
      return false;
    }

    // Validate direction
    if (!this.validateDirection(input.direction)) {
      this.flagPlayer(playerId, 'INVALID_DIRECTION');
      return false;
    }

    // Check for bot patterns
    if (this.detectBotPattern(data)) {
      this.flagPlayer(playerId, 'BOT_PATTERN');
      return false;
    }

    // Record input
    data.inputHistory.push({
      timestamp: Date.now(),
      direction: input.direction
    });

    // Keep only last 20 inputs
    if (data.inputHistory.length > 20) {
      data.inputHistory.shift();
    }

    return true;
  }

  private validateInputTiming(data: PlayerData, input: any): boolean {
    if (data.inputHistory.length === 0) return true;

    const lastInput = data.inputHistory[data.inputHistory.length - 1];
    const timeDiff = Date.now() - lastInput.timestamp;

    return timeDiff >= this.MIN_INPUT_DELAY;
  }

  private validateDirection(direction: string): boolean {
    return ['up', 'down', 'left', 'right'].includes(direction);
  }

  private detectBotPattern(data: PlayerData): boolean {
    if (data.inputHistory.length < 10) return false;

    // Calculate time intervals between inputs
    const intervals: number[] = [];
    for (let i = 1; i < data.inputHistory.length; i++) {
      intervals.push(
        data.inputHistory[i].timestamp - data.inputHistory[i - 1].timestamp
      );
    }

    // Calculate standard deviation
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Bots have very consistent timing (low standard deviation)
    return stdDev < 10;
  }

  private flagPlayer(playerId: string, reason: string): void {
    const data = this.playerData.get(playerId);
    if (!data) return;

    data.warningCount++;
    console.warn(`[ANTICHEAT] Player ${playerId} flagged: ${reason} (${data.warningCount}/${this.MAX_WARNINGS})`);

    if (data.warningCount >= this.MAX_WARNINGS) {
      data.flagged = true;
      console.error(`[ANTICHEAT] Player ${playerId} BANNED`);
    }
  }

  clearPlayerData(playerId: string): void {
    this.playerData.delete(playerId);
  }

  isPlayerFlagged(playerId: string): boolean {
    return this.playerData.get(playerId)?.flagged || false;
  }
}
