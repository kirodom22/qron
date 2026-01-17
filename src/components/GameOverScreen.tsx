import React, { useEffect, useRef } from 'react';
import { Trophy, ArrowRight, Clock, Award, Zap } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useProfileStore, MatchReplay } from '../store/profileStore';
import { socketService } from '../services/socketService';

export const GameOverScreen: React.FC = () => {
  const { rankings, resetGame, selectedMode, players, gridSize, gameStartTime } = useGameStore();
  const {
    receiveWinnings,
    updateStatsAfterMatch,
    recordMatch
  } = useProfileStore();
  const socketId = socketService.getSocketId();
  const hasRecordedMatch = useRef(false);

  const userRanking = rankings.find(r => r.playerId === socketId);
  const isWinner = userRanking && userRanking.rank === 1;
  const isTop3 = userRanking && userRanking.rank <= 3;

  // Record match results and receive winnings once when game ends
  useEffect(() => {
    if (!userRanking || hasRecordedMatch.current) return;
    hasRecordedMatch.current = true;

    const entryFee = selectedMode?.entryFee || 1.0;
    const prize = userRanking.prize || 0;
    const profit = prize - entryFee; // Only profit (winnings minus entry)

    // Receive winnings if any
    if (prize > 0) {
      receiveWinnings(prize);
    }

    // Update profile stats
    updateStatsAfterMatch(
      selectedMode?.id || 'unknown',
      userRanking.rank,
      profit,
      userRanking.kills || 0,
      rankings.length
    );

    // Record match replay (simplified - in real app, would capture full game state)
    const matchReplay: MatchReplay = {
      id: `match_${Date.now()}`,
      mode: selectedMode?.id || 'unknown',
      modeName: selectedMode?.name || 'Unknown Mode',
      gridSize: gridSize,
      timestamp: gameStartTime || Date.now(),
      duration: userRanking.survivalTime || 0,
      players: rankings.map(r => ({
        id: r.playerId,
        name: r.playerName,
        isBot: r.playerId.startsWith('bot_'),
        placement: r.rank,
        kills: r.kills || 0,
        color: players.find(p => p.id === r.playerId)?.color || '#ffffff'
      })),
      ticks: [], // Would be captured during gameplay
      arenaStates: [],
      winner: rankings[0]?.playerName || 'Unknown',
      userPlacement: userRanking.rank,
      userProfit: profit
    };

    recordMatch(matchReplay);
  }, [userRanking, rankings, selectedMode, gridSize, gameStartTime, players, receiveWinnings, updateStatsAfterMatch, recordMatch]);

  const handlePlayAgain = () => {
    hasRecordedMatch.current = false;
    resetGame();
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8 relative noise-bg">
      <div className="w-full max-w-md animate-slide-up">
        {/* Result card */}
        <div
          className="panel glow-subtle overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #18181c 0%, #111114 100%)',
            borderColor: isWinner ? 'var(--amber)' : 'var(--border-subtle)'
          }}
        >
          {/* Header */}
          <div
            className="p-6 text-center"
            style={{
              background: isWinner
                ? 'linear-gradient(180deg, rgba(229, 165, 48, 0.15) 0%, transparent 100%)'
                : isTop3
                  ? 'linear-gradient(180deg, rgba(36, 214, 122, 0.1) 0%, transparent 100%)'
                  : 'transparent',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{
                background: isWinner
                  ? 'linear-gradient(135deg, var(--amber) 0%, #d4941f 100%)'
                  : isTop3
                    ? 'rgba(36, 214, 122, 0.15)'
                    : 'var(--bg-elevated)'
              }}
            >
              {isWinner ? (
                <Trophy size={28} className="text-[#0c0c0e]" />
              ) : isTop3 ? (
                <Award size={28} className="text-green" />
              ) : (
                <Zap size={28} className="text-[var(--text-muted)]" />
              )}
            </div>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
              {isWinner ? 'Victory!' : isTop3 ? 'Top 3 Finish' : 'Game Over'}
            </h2>

            {userRanking && (
              <p className="text-[var(--text-muted)] text-sm">
                You placed <span className="text-[var(--text-primary)] font-medium">#{userRanking.rank}</span> out of {rankings.length}
              </p>
            )}
          </div>

          {/* Stats */}
          {userRanking && (
            <div className="p-4">
              <div className="stat-row">
                <span className="stat-label flex items-center gap-2">
                  <Clock size={12} />
                  Survival Time
                </span>
                <span className="stat-value">{userRanking.survivalTime}s</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">Payout</span>
                <span
                  className="stat-value font-semibold"
                  style={{ color: userRanking.prize > 0 ? 'var(--green)' : 'var(--text-muted)' }}
                >
                  {userRanking.prize > 0 ? `+$${userRanking.prize.toFixed(2)}` : '$0.00'}
                </span>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="px-4 pb-4">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-2">
              Top 3
            </div>
            <div
              className="rounded overflow-hidden"
              style={{ background: 'var(--bg-primary)' }}
            >
              {rankings.slice(0, 3).map((ranking, index) => {
                const isUser = ranking.playerId === socketId;
                const positionColors = ['#e5a530', '#a1a1a6', '#cd7f32']; // Gold, Silver, Bronze

                return (
                  <div
                    key={ranking.playerId}
                    className="flex justify-between items-center px-3 py-2 text-[11px]"
                    style={{
                      borderBottom: index < 2 ? '1px solid var(--border-subtle)' : 'none',
                      background: isUser ? 'rgba(229, 165, 48, 0.1)' : 'transparent'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-[#0c0c0e]"
                        style={{ background: positionColors[index] }}
                      >
                        {index + 1}
                      </span>
                      <span className={isUser ? 'text-amber font-medium' : 'text-[var(--text-primary)]'}>
                        {ranking.playerName}
                        {isUser && ' (you)'}
                      </span>
                    </div>
                    <span className="text-green font-medium">
                      ${ranking.prize.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action */}
          <div className="p-4 pt-0">
            <button
              onClick={handlePlayAgain}
              className="btn-primary w-full"
            >
              Play Again
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
