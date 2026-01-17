import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { useProfileStore } from './store/profileStore';
import { LobbySelector } from './components/LobbySelector';
import { LobbyScreen } from './components/LobbyScreen';
import { CountdownScreen } from './components/CountdownScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { Header } from './components/Header';
import { SidePanel } from './components/SidePanel';
import { Footer } from './components/Footer';
import { socketService } from './services/socketService';

const App: React.FC = () => {
  const { gameState, initializeSocket, selectMode, players } = useGameStore();
  const { isProfileComplete, isWalletConnected, wallet, canPlay } = useProfileStore();

  const [showProfile, setShowProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initializeSocket();

    return () => {
      socketService.disconnect();
    };
  }, [initializeSocket]);

  // Check if user needs onboarding
  useEffect(() => {
    if (!isProfileComplete || !isWalletConnected || !wallet || wallet.gameBalance <= 0) {
      setShowOnboarding(true);
    }
  }, [isProfileComplete, isWalletConnected, wallet]);

  // Show side panel when there are players or during active game states
  const showSidePanel = gameState === 'PLAYING' || gameState === 'COUNTDOWN' ||
    gameState === 'GAME_OVER' || (gameState === 'LOBBY' && players.length > 0);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    if (canPlay()) {
      setShowOnboarding(false);
    }
  };

  // Show onboarding if not set up
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Show profile screen
  if (showProfile) {
    return (
      <div
        className="h-screen w-full flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}
      >
        <Header
          onProfileClick={() => setShowProfile(true)}
          onLogoClick={() => setShowProfile(false)}
          showBackButton={true}
        />
        <div className="flex-1 overflow-hidden">
          <ProfileScreen />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Header
        onProfileClick={() => setShowProfile(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main content area - takes full space */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Main game/lobby area - no extra padding, full bleed */}
          <div
            className="flex-1 flex overflow-hidden relative"
            style={{ background: 'var(--bg-primary)' }}
          >
            {gameState === 'MODE_SELECT' && <LobbySelector onSelectMode={selectMode} />}
            {gameState === 'LOBBY' && <LobbyScreen />}
            {gameState === 'COUNTDOWN' && <CountdownScreen />}
            {gameState === 'PLAYING' && <GameScreen />}
            {gameState === 'GAME_OVER' && <GameOverScreen />}
          </div>
        </div>

        {/* Side panel - wider and always visible during gameplay */}
        {showSidePanel && <SidePanel />}
      </div>

      <Footer />
    </div>
  );
};

export default App;
