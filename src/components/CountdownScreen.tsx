import React from 'react';
import { useGameStore } from '../store/gameStore';

export const CountdownScreen: React.FC = () => {
  const { countdown, players } = useGameStore();

  return (
    <div
      className="flex items-center justify-center h-full w-full relative noise-bg"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center animate-slide-up">
        {/* Countdown number */}
        <div
          className="text-[140px] font-bold leading-none mb-2 tabular-nums"
          style={{
            color: 'var(--amber)',
            textShadow: '0 0 60px rgba(229, 165, 48, 0.4)'
          }}
        >
          {countdown}
        </div>

        <div className="text-lg font-medium text-[var(--text-primary)] mb-8">
          Get Ready
        </div>

        {/* Player list */}
        <div
          className="panel p-4 max-w-lg mx-auto"
          style={{ background: 'linear-gradient(180deg, #18181c 0%, #111114 100%)' }}
        >
          <div className="text-[10px] text-[var(--text-muted)] mb-3 uppercase tracking-wide">
            {players.length} players in arena
          </div>

          <div className="grid grid-cols-4 gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="text-[10px] text-[var(--text-primary)] p-2 rounded flex items-center gap-2"
                style={{
                  background: 'var(--bg-primary)',
                  borderLeft: `3px solid ${player.color}`
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                <span className="truncate">{player.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-[11px] text-[var(--text-muted)]">
          Use arrow keys to steer
        </div>
      </div>
    </div>
  );
};
