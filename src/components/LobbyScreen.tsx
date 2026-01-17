import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Users, Target, TrendingUp, Crown, Medal, Award, Clock, Zap, AlertCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useProfileStore } from '../store/profileStore';

// Simulated recent winnings for live feed
const RECENT_WINS = [
  { player: 'RIDER_8812', amount: 5.60, mode: 'RANKED', time: 12 },
  { player: 'VOID_HUNTER', amount: 0.90, mode: '1v1', time: 34 },
  { player: 'SECTOR_7', amount: 7.00, mode: 'ARENA', time: 58 },
  { player: 'NEON_PULSE', amount: 1.40, mode: 'SQUAD', time: 89 },
  { player: 'GRID_MASTER', amount: 4.86, mode: 'RANKED', time: 124 },
  { player: 'BYTE_RUNNER', amount: 0.90, mode: '1v1', time: 156 },
];


export const LobbyScreen: React.FC = () => {
  const { joinLobby, playersInLobby, requiredPlayers, addLog, selectedMode, potSize } = useGameStore();
  const {
    wallet,
    isWalletConnected,
    payEntryFee
  } = useProfileStore();

  const [hasJoined, setHasJoined] = useState(false);
  const [lobbyTimer, setLobbyTimer] = useState(0);
  const [winFeedIndex, setWinFeedIndex] = useState(0);
  const [insufficientFunds, setInsufficientFunds] = useState(false);

  // Lobby waiting timer
  useEffect(() => {
    if (hasJoined && playersInLobby < requiredPlayers) {
      const interval = setInterval(() => {
        setLobbyTimer(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [hasJoined, playersInLobby, requiredPlayers]);

  // Animated win feed - faster for more dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setWinFeedIndex(prev => (prev + 1) % RECENT_WINS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinGame = async () => {
    if (!isWalletConnected || !wallet) {
      addLog('Wallet not connected');
      return;
    }

    const entryFee = selectedMode?.entryFee || 1.0;

    // Check if user has enough balance
    if (wallet.gameBalance < entryFee) {
      setInsufficientFunds(true);
      addLog('Insufficient funds - please deposit more');
      return;
    }

    // Pay entry fee from profile wallet
    const success = payEntryFee(entryFee);
    if (!success) {
      addLog('Failed to pay entry fee');
      return;
    }

    setInsufficientFunds(false);
    joinLobby(wallet.address);
    setHasJoined(true);
    setLobbyTimer(0);
    addLog(`Entry fee paid: $${entryFee.toFixed(2)} - Joining lobby...`);
  };

  // Use selected mode values, with fallbacks
  const modeName = selectedMode?.name || 'ARENA';
  const modeDescription = selectedMode?.description || 'Battle royale';
  const maxPlayers = selectedMode?.players || requiredPlayers;
  const entryFee = selectedMode?.entryFee || 1.0;
  const prizePool = potSize || selectedMode?.prize || 7.0;
  const is1v1 = maxPlayers === 2;
  const isSquad = maxPlayers === 4;

  // Calculate payout structure based on mode
  const getPayoutStructure = () => {
    if (is1v1) {
      return [{ label: 'Winner Takes All', percent: 1.0, icon: Crown }];
    } else if (isSquad) {
      return [
        { label: '1st Place', percent: 0.75, icon: Crown },
        { label: '2nd Place', percent: 0.25, icon: Medal },
      ];
    } else {
      return [
        { label: '1st Place', percent: 0.694, icon: Crown },
        { label: '2nd Place', percent: 0.208, icon: Medal },
        { label: '3rd Place', percent: 0.098, icon: Award },
      ];
    }
  };

  const payoutStructure = getPayoutStructure();
  const winnerTakePercent = is1v1 ? '100%' : isSquad ? '75%' : '69%';

  // Format timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Estimated wait time (15 seconds timeout from server)
  const estimatedWait = Math.max(0, 15 - lobbyTimer);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Live Winnings Ticker - Top - Fixed height to prevent layout shifts */}
      <div
        className="w-full py-2 px-4 flex items-center gap-4 overflow-hidden shrink-0"
        style={{
          height: '36px',
          background: 'linear-gradient(90deg, rgba(36, 214, 122, 0.1) 0%, rgba(36, 214, 122, 0.02) 50%, rgba(36, 214, 122, 0.1) 100%)',
          borderBottom: '1px solid rgba(36, 214, 122, 0.2)'
        }}
      >
        <div className="flex items-center gap-2 shrink-0">
          <Zap size={12} className="text-[#24d67a]" />
          <span className="text-[10px] text-[#24d67a] uppercase font-medium">Live Wins</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="flex gap-8 transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${winFeedIndex * 180}px)` }}
          >
            {[...RECENT_WINS, ...RECENT_WINS, ...RECENT_WINS].map((win, i) => (
              <div key={i} className="flex items-center gap-3 shrink-0 text-[11px]" style={{ minWidth: '172px' }}>
                <span className="text-white font-medium truncate max-w-[80px]">{win.player}</span>
                <span className="text-[#24d67a] font-bold">+${win.amount.toFixed(2)}</span>
                <span className="text-[#636366]">{win.mode}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Use flex-1 with min-h-0 to prevent overflow */}
      <div className="flex-1 flex items-center justify-center p-8 relative noise-bg">
        <div className="w-full max-w-4xl animate-slide-up">
          {/* Main card */}
          <div
            className="panel glow-subtle overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #18181c 0%, #111114 100%)' }}
          >
            {/* Hero section */}
            <div className="p-8 pb-6 border-b border-[var(--border-subtle)]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                      {modeName} Arena
                    </h1>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(229, 165, 48, 0.15)', color: '#e5a530' }}
                    >
                      {modeDescription}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {is1v1
                      ? '1v1 duel. Winner takes all.'
                      : isSquad
                        ? `${maxPlayers} players compete. Top 2 win.`
                        : `${maxPlayers} players compete. Top 3 split the prize pool.`
                    }
                  </p>
                </div>

                {/* Lobby Status with Timer */}
                {hasJoined && (
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      background: 'rgba(229, 165, 48, 0.1)',
                      border: '1px solid rgba(229, 165, 48, 0.3)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-[#e5a530] animate-pulse" />
                      <span className="text-[10px] text-[#e5a530] uppercase font-medium">
                        In Queue
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-xs text-[#636366]">Players</div>
                        <div className="text-lg font-bold text-white">
                          {playersInLobby}/{maxPlayers}
                        </div>
                      </div>
                      <div className="w-px h-8 bg-[rgba(255,255,255,0.1)]" />
                      <div>
                        <div className="text-xs text-[#636366]">Wait Time</div>
                        <div className="text-lg font-bold text-[#e5a530] font-mono">
                          {formatTimer(lobbyTimer)}
                        </div>
                      </div>
                      {playersInLobby < maxPlayers && (
                        <>
                          <div className="w-px h-8 bg-[rgba(255,255,255,0.1)]" />
                          <div>
                            <div className="text-xs text-[#636366]">Auto-Start</div>
                            <div className="text-lg font-bold text-[#24d67a] font-mono">
                              ~{estimatedWait}s
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {!hasJoined && playersInLobby > 0 && (
                  <div className="badge badge-live">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse-glow" />
                    {playersInLobby}/{maxPlayers} in lobby
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard
                  icon={<TrendingUp size={14} />}
                  label="Prize Pool"
                  value={`$${prizePool.toFixed(2)}`}
                  valueClass="text-green"
                />
                <StatCard
                  icon={<Target size={14} />}
                  label="Entry"
                  value={`$${entryFee.toFixed(2)}`}
                  valueClass="text-amber"
                />
                <StatCard
                  icon={<Users size={14} />}
                  label="Players"
                  value={maxPlayers.toString()}
                />
                <StatCard
                  icon={<Shield size={14} />}
                  label="Winner Take"
                  value={winnerTakePercent}
                  valueClass="text-amber"
                />
              </div>
            </div>

            {/* Action section */}
            <div className="p-6 flex gap-6">
              {/* Left: Wallet & Join */}
              <div className="flex-1 space-y-4">
                {/* Wallet is already connected via onboarding - just show status */}
                <div
                  className="flex items-center gap-3 p-3 rounded"
                  style={{
                    background: 'rgba(36, 214, 122, 0.08)',
                    border: '1px solid rgba(36, 214, 122, 0.2)'
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-[var(--green)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[var(--green)] font-medium">Connected</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                      {wallet?.shortAddress || 'Unknown'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#e5a530]">${wallet?.gameBalance.toFixed(2) || '0.00'}</div>
                    <div className="text-[9px] text-[#636366]">Balance</div>
                  </div>
                </div>

                {/* Insufficient funds warning */}
                {insufficientFunds && (
                  <div
                    className="flex items-center gap-2 p-3 rounded"
                    style={{
                      background: 'rgba(240, 80, 80, 0.1)',
                      border: '1px solid rgba(240, 80, 80, 0.3)'
                    }}
                  >
                    <AlertCircle size={14} className="text-[#f05050]" />
                    <span className="text-xs text-[#f05050]">
                      Insufficient balance. Need ${(selectedMode?.entryFee || 1.0).toFixed(2)} to enter.
                    </span>
                  </div>
                )}

                {!hasJoined ? (
                  <button
                    onClick={handleJoinGame}
                    disabled={!isWalletConnected || (wallet?.gameBalance || 0) < (selectedMode?.entryFee || 1.0)}
                    className="btn-primary w-full"
                  >
                    Enter Arena - ${(selectedMode?.entryFee || 1.0).toFixed(2)}
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <div
                    className="w-full py-4 rounded-lg text-center"
                    style={{
                      background: 'rgba(229, 165, 48, 0.1)',
                      border: '1px solid rgba(229, 165, 48, 0.3)'
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Clock size={16} className="text-[#e5a530] animate-pulse" />
                      <span className="text-sm font-medium text-[#e5a530]">
                        Waiting for players...
                      </span>
                    </div>
                    <p className="text-[10px] text-[#636366] mt-1">
                      Game starts when {maxPlayers} players join or after timeout
                    </p>
                  </div>
                )}

                <p className="text-[9px] text-[var(--text-muted)] text-center">
                  Entry fee deducted from game balance on join
                </p>
              </div>

              {/* Right: Payout structure - DYNAMIC based on mode */}
              <div
                className="w-64 p-4 rounded text-[10px]"
                style={{ background: 'var(--bg-primary)' }}
              >
                <div className="text-[var(--text-muted)] uppercase tracking-wider mb-3 text-[9px]">
                  Payout Structure
                </div>
                <div className="space-y-3">
                  {payoutStructure.map((payout, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <payout.icon
                          size={12}
                          className={index === 0 ? 'text-[#e5a530]' : index === 1 ? 'text-[#a1a1a6]' : 'text-[#636366]'}
                        />
                        <span className="text-[var(--text-secondary)]">{payout.label}</span>
                      </div>
                      <span className={index === 0 ? 'text-[var(--green)] font-medium' : 'text-[var(--text-primary)] font-medium'}>
                        ${(prizePool * payout.percent).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                  <div className="text-[var(--text-muted)] uppercase tracking-wider mb-2 text-[9px]">
                    How to play
                  </div>
                  <ul className="space-y-1.5 text-[var(--text-secondary)]">
                    <li className="flex gap-2">
                      <span className="text-amber">›</span>
                      <span>Arrow keys to steer</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber">›</span>
                      <span>Avoid all trails</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber">›</span>
                      <span>Arena shrinks over time</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber">›</span>
                      <span>
                        <strong className="text-[#e5a530]">YOU</strong> = bright amber glow
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-4 text-center text-[9px] text-[var(--text-muted)]">
            Smart contract verified on TRON network
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat card component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, valueClass = 'text-[var(--text-primary)]' }) => (
  <div
    className="p-3 rounded"
    style={{ background: 'var(--bg-primary)' }}
  >
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">{label}</span>
    </div>
    <div className={`text-lg font-semibold ${valueClass}`}>{value}</div>
  </div>
);
