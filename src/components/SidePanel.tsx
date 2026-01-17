import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socketService';
import { Activity, Users, Trophy, Skull, Timer } from 'lucide-react';

export const SidePanel: React.FC = () => {
  const { players, logs, gameState, arenaSize, gridSize } = useGameStore();
  const socketId = socketService.getSocketId();
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for elapsed game time
  useEffect(() => {
    if (gameState === 'PLAYING') {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [gameState]);

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.alive && !b.alive) return -1;
    if (!a.alive && b.alive) return 1;
    return b.kills - a.kills;
  });

  const aliveCount = players.filter(p => p.alive).length;
  const zonePercent = gridSize > 0 ? Math.round((arenaSize / gridSize) * 100) : 100;

  return (
    <div
      className="w-72 flex flex-col h-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #111114 0%, #0c0c0e 100%)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Stats Header */}
      {gameState === 'PLAYING' && (
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] bg-[#0c0c0e]">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users size={12} className="text-[#a1a1a6]" />
              </div>
              <div className="text-lg font-bold text-[#24d67a]">{aliveCount}</div>
              <div className="text-[9px] text-[#636366]">ALIVE</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Timer size={12} className="text-[#a1a1a6]" />
              </div>
              <div className="text-lg font-bold text-white">{elapsedTime}s</div>
              <div className="text-[9px] text-[#636366]">TIME</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity size={12} className="text-[#a1a1a6]" />
              </div>
              <div
                className="text-lg font-bold"
                style={{
                  color: zonePercent < 40 ? '#f05050' : zonePercent < 70 ? '#e5a530' : '#24d67a'
                }}
              >
                {zonePercent}%
              </div>
              <div className="text-[9px] text-[#636366]">ZONE</div>
            </div>
          </div>
        </div>
      )}

      {/* Players Header */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]"
        style={{ background: '#111114' }}
      >
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[#e5a530]" />
          <span className="text-xs font-semibold text-white uppercase tracking-wide">Players</span>
        </div>
        <span className="text-xs text-[#636366]">
          {aliveCount}/{players.length}
        </span>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sortedPlayers.length === 0 ? (
          <div className="p-6 text-center">
            <Users size={32} className="text-[#2a2a30] mx-auto mb-3" />
            <div className="text-sm text-[#636366]">Waiting for players...</div>
          </div>
        ) : (
          sortedPlayers.map((player, index) => {
            const isUser = player.id === socketId;

            return (
              <div
                key={player.id}
                className="px-4 py-3 flex items-center gap-3 transition-all duration-200"
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  opacity: player.alive ? 1 : 0.4,
                  background: isUser
                    ? 'rgba(229, 165, 48, 0.1)'
                    : index % 2 === 0
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'transparent'
                }}
              >
                {/* Rank / Status indicator */}
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: player.alive
                      ? `${player.color}20`
                      : 'rgba(240, 80, 80, 0.1)',
                    color: player.alive ? player.color : '#f05050'
                  }}
                >
                  {player.alive ? (index + 1) : <Skull size={12} />}
                </div>

                {/* Player color dot */}
                <div
                  className="w-3 h-3 rounded-sm shadow-sm"
                  style={{
                    backgroundColor: player.color,
                    boxShadow: player.alive ? `0 0 8px ${player.color}40` : 'none'
                  }}
                />

                {/* Player name */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-medium truncate"
                    style={{
                      color: player.alive ? '#f5f5f7' : '#636366',
                      textDecoration: player.alive ? 'none' : 'line-through'
                    }}
                  >
                    {player.name}
                    {isUser && <span className="text-[#e5a530] ml-1">(YOU)</span>}
                  </div>
                  {player.kills > 0 && (
                    <div className="text-[9px] text-[#f05050] flex items-center gap-1">
                      <Trophy size={8} />
                      {player.kills} kills
                    </div>
                  )}
                </div>

                {/* Status */}
                <div
                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{
                    background: player.alive ? 'rgba(36, 214, 122, 0.15)' : 'rgba(240, 80, 80, 0.15)',
                    color: player.alive ? '#24d67a' : '#f05050'
                  }}
                >
                  {player.alive ? 'LIVE' : 'OUT'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Activity Log Header */}
      <div
        className="px-4 py-3 flex items-center gap-2 border-t border-b border-[rgba(255,255,255,0.06)]"
        style={{ background: '#111114' }}
      >
        <Activity size={14} className="text-[#e5a530]" />
        <span className="text-xs font-semibold text-white uppercase tracking-wide">Activity Log</span>
      </div>

      {/* Activity Log */}
      <div
        className="h-40 overflow-y-auto"
        style={{ background: '#0a0a0c' }}
      >
        {logs.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#636366]">
            No activity yet
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {logs.map((log, i) => (
              <div
                key={i}
                className="flex gap-2 text-[11px] leading-relaxed"
                style={{ opacity: Math.max(0.4, 1 - (i * 0.15)) }}
              >
                <span className="text-[#e5a530]">›</span>
                <span className="text-[#a1a1a6]">{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
