import React, { useState, useEffect } from 'react';
import { Zap, Signal, Wifi, User, Wallet } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useProfileStore } from '../store/profileStore';

interface HeaderProps {
  onProfileClick?: () => void;
  onLogoClick?: () => void;
  showBackButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onProfileClick, onLogoClick, showBackButton }) => {
  const { potSize, players, gameState, resetGame } = useGameStore();
  const { profile, wallet, isWalletConnected } = useProfileStore();
  const aliveCount = players.filter(p => p.alive).length;
  const [time, setTime] = useState(new Date());
  const [ping, setPing] = useState(12);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setPing(Math.floor(Math.random() * 15) + 8);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else if (gameState !== 'PLAYING' && gameState !== 'COUNTDOWN') {
      resetGame();
    }
  };

  const canGoBack = showBackButton || (gameState !== 'PLAYING' && gameState !== 'COUNTDOWN');

  return (
    <header
      className="h-12 flex items-center justify-between px-4"
      style={{
        background: 'linear-gradient(180deg, #141418 0%, #0e0e12 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Left: Brand & Network */}
      <div className="flex items-center gap-5">
        <button
          onClick={handleLogoClick}
          className={`flex items-center gap-3 ${canGoBack ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} transition-opacity`}
          title={canGoBack ? 'Back to menu' : ''}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #e5a530 0%, #d4941f 100%)',
              boxShadow: '0 2px 8px rgba(229, 165, 48, 0.3)'
            }}
          >
            <Zap size={18} className="text-[#0c0c0e]" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">QRON</div>
            <div className="text-[9px] text-[#636366]">LIGHTCYCLE ARENA</div>
          </div>
        </button>

        <div className="h-6 w-px bg-[rgba(255,255,255,0.1)]" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Signal size={12} className="text-[#24d67a]" />
            <span className="text-[10px] text-[#24d67a] font-medium">MAINNET</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi size={12} className="text-[#a1a1a6]" />
            <span className="text-[10px] text-[#a1a1a6]">{ping}ms</span>
          </div>
        </div>
      </div>

      {/* Center: Game Status - only show during active game */}
      {gameState === 'PLAYING' && players.length > 0 && (
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#636366]">Pool</span>
            <span className="text-[#24d67a] font-semibold">${potSize.toFixed(2)}</span>
          </div>
          <div className="h-4 w-px bg-[rgba(255,255,255,0.1)]" />
          <div className="flex items-center gap-2">
            <span className="text-[#636366]">Alive</span>
            <span className="text-white font-semibold">{aliveCount}/{players.length}</span>
          </div>
        </div>
      )}

      {/* Right: Profile & Wallet */}
      <div className="flex items-center gap-4">
        {/* Wallet Balance */}
        {isWalletConnected && wallet && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)]">
            <Wallet size={12} className="text-[#e5a530]" />
            <span className="text-xs font-semibold text-[#e5a530]">
              ${wallet.gameBalance.toFixed(2)}
            </span>
          </div>
        )}

        {/* Profile Button */}
        {profile && (
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, #e5a530 0%, #d4941f 100%)',
                color: '#0c0c0e'
              }}
            >
              {profile.avatar.length === 1 ? profile.avatar : <User size={14} />}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs text-white font-medium">{profile.name}</div>
              <div className="text-[9px] text-[#636366]">
                {profile.lifetimeProfit >= 0 ? '+' : ''}${profile.lifetimeProfit.toFixed(2)} profit
              </div>
            </div>
          </button>
        )}

        {/* Time */}
        <div className="text-right">
          <div className="text-xs text-white font-medium tabular-nums">
            {time.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })}
          </div>
          <div className="text-[9px] text-[#636366]">
            {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    </header>
  );
};
