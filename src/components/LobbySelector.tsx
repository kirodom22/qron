import React, { useState, useEffect } from 'react';
import { Users, Zap, TrendingUp, Activity, ChevronRight, Shield, Crown, Medal, Award } from 'lucide-react';
import { GameMode } from '../store/gameStore';

// Game modes - MUST match server-side configuration
// Prize pools adjusted for ~10-12% house edge (verified by Monte Carlo simulation)
const GAME_MODES: GameMode[] = [
  {
    id: 'duel',
    name: '1v1',
    description: 'Pure skill duel',
    players: 2,
    gridSize: 36,  // Small-Medium
    entryFee: 0.50,
    prize: 0.90    // 10% house edge (0.50*2=1.00, 1.00-0.90=0.10)
  },
  {
    id: 'squad',
    name: 'SQUAD',
    description: '4-player tactical',
    players: 4,
    gridSize: 52,  // Medium
    entryFee: 0.50,
    prize: 1.80    // 10% house edge (0.50*4=2.00, 2.00-1.80=0.20) - WAS 1.40 (30% edge!)
  },
  {
    id: 'ranked',
    name: 'RANKED',
    description: '8-player competitive',
    players: 8,
    gridSize: 84,  // Large
    entryFee: 1.00,
    prize: 7.20    // 10% house edge (1.00*8=8.00, 8.00-7.20=0.80) - WAS 5.60 (30% edge!)
  },
  {
    id: 'arena',
    name: 'ARENA',
    description: '10-player battle royale',
    players: 10,
    gridSize: 112, // Very Large
    entryFee: 1.00,
    prize: 9.00    // 10% house edge (1.00*10=10.00, 10.00-9.00=1.00) - WAS 7.00 (30% edge!)
  }
];

// Live activity feed for visual engagement
const LIVE_ACTIVITIES = [
  { player: 'RIDER_8812', action: 'won', amount: '+$5.60', mode: 'RANKED' },
  { player: 'GRID_MASTER', action: 'eliminated', amount: '', mode: 'ARENA' },
  { player: 'NEON_PULSE', action: 'joined', amount: '', mode: 'ARENA' },
  { player: 'SECTOR_7', action: 'won', amount: '+$7.00', mode: 'ARENA' },
  { player: 'TRON_WOLF', action: 'eliminated', amount: '', mode: '1v1' },
  { player: 'BYTE_RUNNER', action: 'joined', amount: '', mode: 'RANKED' },
  { player: 'VOID_HUNTER', action: 'won', amount: '+$0.90', mode: '1v1' },
  { player: 'APEX_NODE', action: 'eliminated', amount: '', mode: 'SQUAD' },
];

interface Props {
  onSelectMode: (mode: GameMode) => void;
}

export const LobbySelector: React.FC<Props> = ({ onSelectMode }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(GAME_MODES[2]);
  const [liveStats, setLiveStats] = useState({ online: 847, games: 23, volume: 1247.50 });
  const [activityIndex, setActivityIndex] = useState(0);

  // Simulate live stats updates - faster for more dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        online: prev.online + Math.floor(Math.random() * 10) - 5,
        games: Math.max(1, prev.games + Math.floor(Math.random() * 3) - 1),
        volume: prev.volume + (Math.random() * 20 - 10)
      }));
      setActivityIndex(prev => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Left Panel - Mode Selection */}
      <div className="flex-1 flex flex-col p-6 border-r border-[rgba(255,255,255,0.06)]">
        {/* Live Stats Bar */}
        <div className="flex items-center gap-6 mb-6 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#24d67a] animate-pulse" />
            <span className="text-xs text-[#a1a1a6]">LIVE</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Users size={12} className="text-[#a1a1a6]" />
            <span className="text-white font-medium">{liveStats.online}</span>
            <span className="text-[#636366]">online</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Activity size={12} className="text-[#a1a1a6]" />
            <span className="text-white font-medium">{liveStats.games}</span>
            <span className="text-[#636366]">active games</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp size={12} className="text-[#24d67a]" />
            <span className="text-[#24d67a] font-medium">${liveStats.volume.toFixed(0)}</span>
            <span className="text-[#636366]">24h volume</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            SELECT ARENA
          </h1>
          <p className="text-sm text-[#636366]">
            Choose your stakes and enter the grid
          </p>
        </div>

        {/* Mode Cards - Full Width */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {GAME_MODES.map((mode) => {
            const isSelected = selectedMode.id === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode)}
                className="relative group text-left p-5 rounded-lg transition-all duration-200 overflow-hidden"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(229, 165, 48, 0.15) 0%, rgba(229, 165, 48, 0.05) 100%)'
                    : 'linear-gradient(180deg, #18181c 0%, #111114 100%)',
                  border: isSelected
                    ? '2px solid rgba(229, 165, 48, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                {/* Glow effect for selected */}
                {isSelected && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(229, 165, 48, 0.1) 0%, transparent 70%)'
                    }}
                  />
                )}

                {/* Header row */}
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xl font-bold tracking-wide"
                        style={{ color: isSelected ? '#e5a530' : '#f5f5f7' }}
                      >
                        {mode.name}
                      </span>
                    </div>
                    <span className="text-xs text-[#636366]">{mode.description}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#24d67a]">${mode.prize}</div>
                    <div className="text-[10px] text-[#636366]">PRIZE POOL</div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-4 relative z-10">
                  <div className="flex-1 bg-[rgba(0,0,0,0.3)] rounded px-3 py-2">
                    <div className="text-[10px] text-[#636366] mb-1">PLAYERS</div>
                    <div className="text-sm font-semibold text-white">{mode.players}</div>
                  </div>
                  <div className="flex-1 bg-[rgba(0,0,0,0.3)] rounded px-3 py-2">
                    <div className="text-[10px] text-[#636366] mb-1">GRID</div>
                    <div className="text-sm font-semibold text-white">{mode.gridSize}×{mode.gridSize}</div>
                  </div>
                  <div className="flex-1 bg-[rgba(0,0,0,0.3)] rounded px-3 py-2">
                    <div className="text-[10px] text-[#636366] mb-1">ENTRY</div>
                    <div className="text-sm font-semibold text-[#e5a530]">${mode.entryFee}</div>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 rounded-full bg-[#e5a530]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Trade Ticket */}
      <div className="w-[420px] flex flex-col bg-[#0c0c0e]">
        {/* Ticket Header */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] bg-[#111114]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#e5a530]" />
              <span className="text-sm font-semibold text-white uppercase tracking-wider">
                Execute Position
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Shield size={12} className="text-[#24d67a]" />
              <span className="text-[10px] text-[#24d67a]">SECURED</span>
            </div>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="flex-1 p-5 flex flex-col">
          {/* Selected Mode Display */}
          <div
            className="p-4 rounded-lg mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(229, 165, 48, 0.1) 0%, rgba(229, 165, 48, 0.02) 100%)',
              border: '1px solid rgba(229, 165, 48, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#e5a530] font-bold text-lg">{selectedMode.name}</span>
              <span className="text-xs text-[#636366] bg-[rgba(0,0,0,0.3)] px-2 py-1 rounded">
                {selectedMode.players} PLAYERS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-[#636366] mb-1">ENTRY FEE</div>
                <div className="text-xl font-bold text-white">${selectedMode.entryFee.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#636366] mb-1">POTENTIAL WIN</div>
                <div className="text-xl font-bold text-[#24d67a]">${selectedMode.prize.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Payout Breakdown - DYNAMIC based on mode */}
          <div className="mb-4 p-3 bg-[#111114] rounded-lg text-xs">
            <div className="text-[#636366] mb-3 uppercase tracking-wide text-[10px]">Payout Structure</div>
            <div className="space-y-2">
              {selectedMode.players === 2 ? (
                // 1v1: Winner Takes All
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Crown size={12} className="text-[#e5a530]" />
                    <span className="text-[#a1a1a6]">Winner Takes All</span>
                  </div>
                  <span className="text-[#24d67a] font-medium">${selectedMode.prize.toFixed(2)}</span>
                </div>
              ) : selectedMode.players === 4 ? (
                // Squad: Top 2 split
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Crown size={12} className="text-[#e5a530]" />
                      <span className="text-[#a1a1a6]">1st Place (75%)</span>
                    </div>
                    <span className="text-[#24d67a] font-medium">${(selectedMode.prize * 0.75).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Medal size={12} className="text-[#a1a1a6]" />
                      <span className="text-[#a1a1a6]">2nd Place (25%)</span>
                    </div>
                    <span className="text-white font-medium">${(selectedMode.prize * 0.25).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                // Ranked/Arena: Top 3 split
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Crown size={12} className="text-[#e5a530]" />
                      <span className="text-[#a1a1a6]">1st Place (69.4%)</span>
                    </div>
                    <span className="text-[#24d67a] font-medium">${(selectedMode.prize * 0.694).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Medal size={12} className="text-[#a1a1a6]" />
                      <span className="text-[#a1a1a6]">2nd Place (20.8%)</span>
                    </div>
                    <span className="text-white font-medium">${(selectedMode.prize * 0.208).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Award size={12} className="text-[#636366]" />
                      <span className="text-[#a1a1a6]">3rd Place (9.8%)</span>
                    </div>
                    <span className="text-white font-medium">${(selectedMode.prize * 0.098).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Game Info */}
          <div className="mb-4 p-3 bg-[#111114] rounded-lg text-xs">
            <div className="text-[#636366] mb-2 uppercase tracking-wide text-[10px]">Game Info</div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#636366]">Arena Size</span>
                <span className="text-white">{selectedMode.gridSize} × {selectedMode.gridSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#636366]">Game Speed</span>
                <span className="text-white">Strategic</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#636366]">Zone Shrink</span>
                <span className="text-white">Yes</span>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Execute Button */}
          <button
            onClick={() => onSelectMode(selectedMode)}
            className="w-full py-4 rounded-lg font-bold text-base uppercase tracking-wide flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #e5a530 0%, #d4941f 100%)',
              color: '#0c0c0e',
              boxShadow: '0 4px 24px rgba(229, 165, 48, 0.3)'
            }}
          >
            Enter {selectedMode.name} Arena
            <ChevronRight size={18} />
          </button>

          <p className="text-[9px] text-[#636366] text-center mt-3">
            Entry fee transferred to smart contract on execution
          </p>
        </div>

        {/* Live Activity Feed - Fixed height to prevent layout shifts */}
        <div className="border-t border-[rgba(255,255,255,0.06)] bg-[#111114] flex-shrink-0" style={{ minHeight: '140px' }}>
          <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#24d67a] animate-pulse" />
              <span className="text-[10px] text-[#636366] uppercase tracking-wider">Live Activity</span>
            </div>
          </div>
          <div className="p-3 space-y-2" style={{ height: '106px', overflow: 'hidden' }}>
            {/* Show 4 activities with smooth transition */}
            {[...LIVE_ACTIVITIES, ...LIVE_ACTIVITIES].slice(activityIndex, activityIndex + 4).map((activity, i) => (
              <div
                key={`${activity.player}-${activityIndex}-${i}`}
                className="flex items-center justify-between text-[10px] py-1.5 border-b border-[rgba(255,255,255,0.03)] last:border-0 transition-opacity duration-300"
                style={{ opacity: 1 - (i * 0.15) }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white font-medium truncate max-w-[90px]">{activity.player}</span>
                  <span className={`shrink-0 ${activity.action === 'won' ? 'text-[#24d67a]' :
                    activity.action === 'eliminated' ? 'text-[#f05050]' : 'text-[#38bdf8]'
                    }`}>
                    {activity.action}
                  </span>
                  <span className="text-[#636366] shrink-0">{activity.mode}</span>
                </div>
                {activity.amount && (
                  <span className="text-[#24d67a] font-medium shrink-0 ml-2">{activity.amount}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
