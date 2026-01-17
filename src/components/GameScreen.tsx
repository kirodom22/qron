import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socketService';
import { Target, Zap } from 'lucide-react';



export const GameScreen: React.FC = () => {
  const { players, gridSize, arenaSize, sendInput } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastRenderTimeRef = useRef<number>(0);
  const socketId = socketService.getSocketId();
  const [canvasSize, setCanvasSize] = useState(600);



  // Calculate canvas size based on container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const size = Math.min(container.clientWidth - 40, container.clientHeight - 40);
        setCanvasSize(Math.max(400, Math.min(800, size)));
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Memoize cell size calculation
  const CELL_SIZE = useMemo(() => Math.floor(canvasSize / gridSize), [canvasSize, gridSize]);

  // Handle keyboard input with useCallback
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const directionMap: Record<string, string> = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
      };
      sendInput(directionMap[e.key]);
    }
  }, [sendInput]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Stable render loop - direct positions, no broken interpolation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const canvasWidth = gridSize * CELL_SIZE;
    const canvasHeight = gridSize * CELL_SIZE;
    const TARGET_FPS = 60;
    const FRAME_TIME = 1000 / TARGET_FPS;

    const render = (timestamp: number) => {
      // Throttle to target FPS
      if (timestamp - lastRenderTimeRef.current < FRAME_TIME) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
      lastRenderTimeRef.current = timestamp;

      // Clear with dark background
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw subtle grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSpacing = CELL_SIZE * 8;
      ctx.beginPath();
      for (let i = 0; i <= canvasWidth; i += gridSpacing) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvasHeight);
        ctx.moveTo(0, i);
        ctx.lineTo(canvasWidth, i);
      }
      ctx.stroke();

      // Draw shrinking zone
      const limit = ((gridSize - arenaSize) / 2) * CELL_SIZE;

      if (limit > 0) {
        ctx.fillStyle = 'rgba(240, 80, 80, 0.08)';
        ctx.fillRect(0, 0, canvasWidth, limit);
        ctx.fillRect(0, limit, limit, arenaSize * CELL_SIZE);
        ctx.fillRect(limit + arenaSize * CELL_SIZE, limit, limit, arenaSize * CELL_SIZE);
        ctx.fillRect(0, limit + arenaSize * CELL_SIZE, canvasWidth, limit);

        // Pulsing border
        const pulseIntensity = 0.4 + Math.sin(timestamp * 0.004) * 0.2;
        ctx.strokeStyle = `rgba(240, 80, 80, ${pulseIntensity})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(limit, limit, arenaSize * CELL_SIZE, arenaSize * CELL_SIZE);
      }

      // Get user player for label
      const userPlayer = players.find(p => p.id === socketId);

      // Draw ALL players - DIRECT positions, no interpolation = no snapping
      players.forEach(player => {
        const isUserPlayer = player.id === socketId;
        const trailLength = player.trail.length;

        // Draw trail with gradient fade
        if (trailLength > 0) {
          ctx.shadowColor = player.color;
          ctx.shadowBlur = 3;

          for (let i = 0; i < trailLength; i++) {
            const segment = player.trail[i];
            ctx.globalAlpha = 0.25 + (i / trailLength) * 0.55;
            ctx.fillStyle = player.color;
            ctx.fillRect(
              segment.x * CELL_SIZE + 1,
              segment.y * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );
          }
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }

        // Draw lightcycle head at ACTUAL position
        if (player.alive) {
          const headX = player.position.x * CELL_SIZE;
          const headY = player.position.y * CELL_SIZE;

          if (isUserPlayer) {
            // User player - amber glow
            ctx.shadowColor = '#e5a530';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(headX - 1, headY - 1, CELL_SIZE + 2, CELL_SIZE + 2);
            ctx.shadowBlur = 0;

            // Direction indicator
            for (let i = 1; i <= 2; i++) {
              const dirX = player.position.x + player.direction.dx * i;
              const dirY = player.position.y + player.direction.dy * i;
              ctx.fillStyle = `rgba(229, 165, 48, ${0.35 - i * 0.12})`;
              ctx.fillRect(dirX * CELL_SIZE, dirY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
          } else {
            // Other players
            ctx.shadowColor = player.color;
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(headX, headY, CELL_SIZE, CELL_SIZE);
            ctx.shadowBlur = 0;
          }
        }
      });

      // Draw "YOU" label
      if (userPlayer && userPlayer.alive) {
        const labelX = userPlayer.position.x * CELL_SIZE + CELL_SIZE / 2;
        const labelY = userPlayer.position.y * CELL_SIZE - CELL_SIZE * 1.5;

        ctx.fillStyle = 'rgba(229, 165, 48, 0.95)';
        const labelWidth = 28;
        const labelHeight = 12;
        ctx.fillRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);

        ctx.fillStyle = '#0c0c0e';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('YOU', labelX, labelY);

        // Arrow
        ctx.fillStyle = '#e5a530';
        ctx.beginPath();
        ctx.moveTo(labelX, labelY + labelHeight / 2);
        ctx.lineTo(labelX - 4, labelY + labelHeight / 2 + 4);
        ctx.lineTo(labelX + 4, labelY + labelHeight / 2 + 4);
        ctx.closePath();
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [players, gridSize, arenaSize, socketId, CELL_SIZE]);

  const userPlayerData = players.find(p => p.id === socketId);
  const aliveCount = players.filter(p => p.alive).length;
  const zonePercent = Math.round((arenaSize / gridSize) * 100);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full"
      style={{ background: 'linear-gradient(180deg, #0c0c0e 0%, #080808 100%)' }}
    >
      {/* Canvas container */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 80px rgba(229, 165, 48, 0.08)'
        }}
      >
        <canvas
          ref={canvasRef}
          width={gridSize * CELL_SIZE}
          height={gridSize * CELL_SIZE}
          style={{
            backgroundColor: '#0a0a0c',
            imageRendering: 'pixelated',
            display: 'block'
          }}
        />
      </div>

      {/* HUD Overlay - Top Left */}
      <div
        className="absolute top-4 left-4 rounded-lg p-4 min-w-[120px]"
        style={{
          background: 'rgba(12, 12, 14, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[rgba(255,255,255,0.06)]">
          <Target size={14} className="text-[#e5a530]" />
          <span className="text-[10px] text-[#a1a1a6] uppercase tracking-wide">Arena</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#636366]">Zone</span>
            <span
              className="text-sm font-bold"
              style={{
                color: zonePercent < 40 ? '#f05050' : zonePercent < 70 ? '#e5a530' : '#24d67a'
              }}
            >
              {zonePercent}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#636366]">Alive</span>
            <span className="text-sm font-bold text-[#24d67a]">{aliveCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[#636366]">Grid</span>
            <span className="text-sm font-medium text-white">{gridSize}²</span>
          </div>
        </div>
      </div>

      {/* HUD Overlay - Top Right */}
      {userPlayerData && (
        <div
          className="absolute top-4 right-4 rounded-lg p-4 min-w-[140px]"
          style={{
            background: 'rgba(12, 12, 14, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(229, 165, 48, 0.3)'
          }}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[rgba(255,255,255,0.06)]">
            <Zap size={14} className="text-[#e5a530]" />
            <span className="text-[10px] text-[#e5a530] uppercase tracking-wide font-semibold">Your Cycle</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#636366]">Status</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  background: userPlayerData.alive ? 'rgba(36, 214, 122, 0.15)' : 'rgba(240, 80, 80, 0.15)',
                  color: userPlayerData.alive ? '#24d67a' : '#f05050'
                }}
              >
                {userPlayerData.alive ? 'LIVE' : 'OUT'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#636366]">Trail</span>
              <span className="text-sm font-medium text-white">{userPlayerData.trail.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#636366]">Kills</span>
              <span className="text-sm font-bold text-[#f05050]">{userPlayerData.kills || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs text-[#636366]"
        style={{
          background: 'rgba(12, 12, 14, 0.8)',
          backdropFilter: 'blur(4px)'
        }}
      >
        ← ↑ ↓ → Arrow keys to steer
      </div>
    </div>
  );
};
