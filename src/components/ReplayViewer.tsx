import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, FastForward, ChevronLeft } from 'lucide-react';
import { MatchReplay } from '../store/profileStore';

interface ReplayViewerProps {
    replay: MatchReplay;
    onClose: () => void;
}

export const ReplayViewer: React.FC<ReplayViewerProps> = ({ replay, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTick, setCurrentTick] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const animationRef = useRef<number>();
    const lastTickTimeRef = useRef<number>(0);

    const CELL_SIZE = 6;
    const canvasSize = replay.gridSize * CELL_SIZE;

    // Player colors
    const playerColors = [
        '#e5a530', '#24d67a', '#f05050', '#38bdf8',
        '#a78bfa', '#f472b6', '#22d3d1', '#fb923c',
        '#84cc16', '#06b6d4'
    ];

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Draw the replay state at a given tick
    const drawFrame = useCallback((tick: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridSpacing = CELL_SIZE * 8;
        ctx.beginPath();
        for (let i = 0; i <= canvasSize; i += gridSpacing) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvasSize);
            ctx.moveTo(0, i);
            ctx.lineTo(canvasSize, i);
        }
        ctx.stroke();

        // Find arena size at this tick
        const arenaState = replay.arenaStates.find(s => s.tick <= tick);
        const arenaSize = arenaState?.size || replay.gridSize;
        const limit = ((replay.gridSize - arenaSize) / 2) * CELL_SIZE;

        // Draw shrinking zone
        if (limit > 0) {
            ctx.fillStyle = 'rgba(240, 80, 80, 0.15)';
            ctx.fillRect(0, 0, canvasSize, limit);
            ctx.fillRect(0, limit, limit, arenaSize * CELL_SIZE);
            ctx.fillRect(limit + arenaSize * CELL_SIZE, limit, limit, arenaSize * CELL_SIZE);
            ctx.fillRect(0, limit + arenaSize * CELL_SIZE, canvasSize, limit);

            ctx.strokeStyle = 'rgba(240, 80, 80, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(limit, limit, arenaSize * CELL_SIZE, arenaSize * CELL_SIZE);
        }

        // For simplified replay (no tick data), just show final positions
        if (replay.ticks.length === 0) {
            // Draw placeholder text
            ctx.fillStyle = '#636366';
            ctx.font = '14px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Match replay data not available', canvasSize / 2, canvasSize / 2 - 20);
            ctx.fillText('(Replay recording will be enabled in future games)', canvasSize / 2, canvasSize / 2 + 10);
            return;
        }

        // Find the tick data
        const tickData = replay.ticks[Math.min(tick, replay.ticks.length - 1)];
        if (!tickData) return;

        // Draw each player
        replay.players.forEach((player, index) => {
            const color = playerColors[index % playerColors.length];
            const playerPos = tickData.p[player.id];

            if (!playerPos) return;

            const [x, y] = playerPos;
            const isEliminated = tickData.e.includes(player.id);

            if (!isEliminated) {
                // Draw player head
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.shadowBlur = 0;

                // Draw name label
                ctx.fillStyle = color;
                ctx.font = 'bold 8px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(player.name.substring(0, 8), x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE - 4);
            }
        });
    }, [replay, canvasSize]);

    // Playback loop
    useEffect(() => {
        if (!isPlaying) return;

        const tickDuration = (1000 / 20) / playbackSpeed; // 20 ticks per second, adjusted for speed

        const loop = (timestamp: number) => {
            if (timestamp - lastTickTimeRef.current >= tickDuration) {
                lastTickTimeRef.current = timestamp;

                setCurrentTick(prev => {
                    const next = prev + 1;
                    if (next >= replay.duration * 20) { // Assuming 20 ticks per second
                        setIsPlaying(false);
                        return prev;
                    }
                    return next;
                });
            }

            animationRef.current = requestAnimationFrame(loop);
        };

        animationRef.current = requestAnimationFrame(loop);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, playbackSpeed, replay.duration]);

    // Draw frame when tick changes
    useEffect(() => {
        drawFrame(currentTick);
    }, [currentTick, drawFrame]);

    // Initial draw
    useEffect(() => {
        drawFrame(0);
    }, [drawFrame]);

    const togglePlay = () => setIsPlaying(!isPlaying);
    const restart = () => { setCurrentTick(0); setIsPlaying(false); };
    const skipToEnd = () => { setCurrentTick(replay.duration * 20 - 1); setIsPlaying(false); };
    const cycleSpeed = () => setPlaybackSpeed(prev => prev >= 4 ? 0.5 : prev * 2);

    const progress = replay.duration > 0 ? (currentTick / (replay.duration * 20)) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.9)] flex items-center justify-center z-50">
            <div
                className="bg-[#111114] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden max-w-4xl w-full mx-4"
                style={{ maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 text-[#636366] hover:text-white transition-colors"
                        >
                            <ChevronLeft size={16} />
                            <span className="text-sm">Back</span>
                        </button>
                        <div className="h-4 w-px bg-[rgba(255,255,255,0.1)]" />
                        <div>
                            <h2 className="text-sm font-semibold text-white">{replay.modeName}</h2>
                            <p className="text-[10px] text-[#636366]">
                                {new Date(replay.timestamp).toLocaleDateString()} - {formatTime(replay.duration)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#636366] hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main content */}
                <div className="flex flex-col lg:flex-row">
                    {/* Canvas */}
                    <div className="flex-1 p-4 flex items-center justify-center bg-[#0c0c0e]">
                        <canvas
                            ref={canvasRef}
                            width={canvasSize}
                            height={canvasSize}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '400px',
                                imageRendering: 'pixelated',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.08)'
                            }}
                        />
                    </div>

                    {/* Sidebar - Player List */}
                    <div className="w-full lg:w-64 p-4 border-t lg:border-t-0 lg:border-l border-[rgba(255,255,255,0.06)]">
                        <h3 className="text-[10px] text-[#636366] uppercase tracking-wide mb-3">Players</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {replay.players
                                .sort((a, b) => a.placement - b.placement)
                                .map((player) => {
                                    const isWinner = player.placement === 1;
                                    return (
                                        <div
                                            key={player.id}
                                            className="flex items-center justify-between p-2 rounded-lg"
                                            style={{
                                                background: isWinner ? 'rgba(229, 165, 48, 0.1)' : 'rgba(255,255,255,0.03)',
                                                border: isWinner ? '1px solid rgba(229, 165, 48, 0.3)' : 'none'
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
                                                    style={{
                                                        background: player.placement <= 3
                                                            ? ['#e5a530', '#a1a1a6', '#cd7f32'][player.placement - 1]
                                                            : 'rgba(255,255,255,0.1)',
                                                        color: player.placement <= 3 ? '#0c0c0e' : '#636366'
                                                    }}
                                                >
                                                    {player.placement}
                                                </span>
                                                <span className={`text-xs ${isWinner ? 'text-[#e5a530] font-medium' : 'text-white'}`}>
                                                    {player.name}
                                                </span>
                                            </div>
                                            {player.isBot && (
                                                <span className="text-[9px] text-[#636366]">BOT</span>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Match Stats */}
                        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-[10px] text-[#636366] uppercase tracking-wide mb-3">Your Result</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
                                    <div className="text-[9px] text-[#636366]">Placement</div>
                                    <div className="text-sm font-bold text-white">#{replay.userPlacement}</div>
                                </div>
                                <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)]">
                                    <div className="text-[9px] text-[#636366]">Profit</div>
                                    <div className={`text-sm font-bold ${replay.userProfit >= 0 ? 'text-[#24d67a]' : 'text-[#f05050]'}`}>
                                        {replay.userProfit >= 0 ? '+' : ''}${replay.userProfit.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Playback Controls */}
                <div className="p-4 border-t border-[rgba(255,255,255,0.06)] bg-[#0c0c0e]">
                    {/* Progress bar */}
                    <div className="mb-4">
                        <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#e5a530] transition-all duration-100"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-[#636366]">{formatTime(Math.floor(currentTick / 20))}</span>
                            <span className="text-[10px] text-[#636366]">{formatTime(replay.duration)}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={restart}
                            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#636366] hover:text-white"
                        >
                            <SkipBack size={18} />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="p-3 rounded-full bg-[#e5a530] text-[#0c0c0e] hover:bg-[#d4941f]"
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button
                            onClick={skipToEnd}
                            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#636366] hover:text-white"
                        >
                            <SkipForward size={18} />
                        </button>
                        <button
                            onClick={cycleSpeed}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[#636366] hover:text-white"
                        >
                            <FastForward size={14} />
                            <span className="text-xs">{playbackSpeed}x</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
