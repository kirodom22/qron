import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Match replay data structure (optimized for grid game)
export interface MatchReplay {
    id: string;
    mode: string;
    modeName: string;
    gridSize: number;
    timestamp: number;
    duration: number; // seconds
    players: {
        id: string;
        name: string;
        isBot: boolean;
        placement: number;
        kills: number;
        color: string;
    }[];
    // Compact replay data: each tick stores only position changes
    ticks: {
        t: number; // tick number
        p: { [playerId: string]: [number, number, number, number] }; // [x, y, dx, dy]
        e: string[]; // eliminated player IDs this tick
    }[];
    arenaStates: { tick: number; size: number }[]; // arena shrink snapshots
    winner: string;
    userPlacement: number;
    userProfit: number; // Only profit, not including entry fee
}

// Player profile data
export interface PlayerProfile {
    id: string;
    name: string;
    avatar: string; // First letter or custom URL
    createdAt: number;

    // Stats (profit-focused)
    totalMatches: number;
    wins: number;
    losses: number;
    lifetimeProfit: number; // Only counts winnings minus entry fees
    peakProfit: number;
    currentStreak: number;
    bestStreak: number;
    totalKills: number;

    // Per-mode stats
    modeStats: {
        [modeId: string]: {
            matches: number;
            wins: number;
            profit: number;
            avgPlacement: number;
        };
    };
}

// Wallet data (mock for development)
export interface WalletData {
    address: string;
    shortAddress: string;
    chainName: string;
    chainId: number;
    balance: number; // Game token balance
    gameBalance: number; // In-game balance for playing
    claimableRewards: number;

    // Transaction history (game-only)
    transactions: {
        id: string;
        type: 'deposit' | 'withdraw' | 'entry_fee' | 'winnings' | 'reward_claim';
        amount: number;
        timestamp: number;
        gameId?: string;
        status: 'pending' | 'confirmed' | 'failed';
    }[];
}

// On-chain stats (mock - would be real blockchain data)
export interface OnChainStats {
    totalMatchesVerified: number;
    tournamentWins: number;
    lifetimeEarningsVerified: number;
    verifiedRank: string;
    lastSyncTime: number;
    proofHash: string; // Merkle root of all stats
}

// Game settings
export interface GameSettings {
    // Camera
    cameraZoom: number; // 0.5 to 2.0
    cameraSmoothing: number; // 0 to 1

    // Accessibility
    colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

    // Controls
    keyBindings: {
        up: string;
        down: string;
        left: string;
        right: string;
    };
    turnBuffering: boolean; // Queue next turn before current completes

    // Graphics
    graphicsLevel: 'low' | 'medium' | 'high';
    showTrailGlow: boolean;
    showParticles: boolean;

    // Network
    showNetworkStats: boolean; // ping, tick rate overlay
    showFPS: boolean;
}

interface ProfileState {
    // Profile
    profile: PlayerProfile | null;
    isProfileComplete: boolean;

    // Wallet
    wallet: WalletData | null;
    isWalletConnected: boolean;

    // On-chain
    onChainStats: OnChainStats | null;

    // Match history
    matchHistory: MatchReplay[];

    // Settings
    settings: GameSettings;

    // Actions - Profile
    createProfile: (name: string) => void;
    updateProfileName: (name: string) => void;
    updateAvatar: (avatar: string) => void;

    // Actions - Wallet
    connectWallet: () => Promise<boolean>;
    disconnectWallet: () => void;
    depositToGame: (amount: number) => Promise<boolean>;
    withdrawFromGame: (amount: number) => Promise<boolean>;
    claimRewards: () => Promise<boolean>;

    // Actions - Gameplay (called after match)
    recordMatch: (replay: MatchReplay) => void;
    updateStatsAfterMatch: (mode: string, placement: number, profit: number, kills: number, totalPlayers: number) => void;
    payEntryFee: (amount: number) => boolean;
    receiveWinnings: (amount: number) => void;

    // Actions - Settings
    updateSettings: (settings: Partial<GameSettings>) => void;
    resetSettings: () => void;

    // Actions - On-chain
    syncOnChainStats: () => Promise<void>;

    // Getters
    canPlay: () => boolean;
    getReplayById: (id: string) => MatchReplay | undefined;
}

const defaultSettings: GameSettings = {
    cameraZoom: 1.0,
    cameraSmoothing: 0.5,
    colorblindMode: 'none',
    keyBindings: {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
    },
    turnBuffering: true,
    graphicsLevel: 'high',
    showTrailGlow: true,
    showParticles: true,
    showNetworkStats: false,
    showFPS: false,
};

// Mock wallet addresses for development
const MOCK_WALLETS = [
    { address: 'TXo4VDm8a1...3kF9', full: 'TXo4VDm8a1xKJqPnM7vR2bC5dE6fG8hI9jK3kF9' },
    { address: 'TNr8WzL2b5...7mH4', full: 'TNr8WzL2b5yUoPsQx0wT3aB6cD9eF1gH2iJ7mH4' },
];

export const useProfileStore = create<ProfileState>()(
    persist(
        (set, get) => ({
            // Initial state
            profile: null,
            isProfileComplete: false,
            wallet: null,
            isWalletConnected: false,
            onChainStats: null,
            matchHistory: [],
            settings: { ...defaultSettings },

            // Profile actions
            createProfile: (name: string) => {
                const avatar = name.charAt(0).toUpperCase();
                const profile: PlayerProfile = {
                    id: `player_${Date.now()}`,
                    name,
                    avatar,
                    createdAt: Date.now(),
                    totalMatches: 0,
                    wins: 0,
                    losses: 0,
                    lifetimeProfit: 0,
                    peakProfit: 0,
                    currentStreak: 0,
                    bestStreak: 0,
                    totalKills: 0,
                    modeStats: {},
                };
                set({ profile, isProfileComplete: true });
            },

            updateProfileName: (name: string) => {
                set(state => ({
                    profile: state.profile ? {
                        ...state.profile,
                        name,
                        avatar: state.profile.avatar.length === 1 ? name.charAt(0).toUpperCase() : state.profile.avatar,
                    } : null,
                }));
            },

            updateAvatar: (avatar: string) => {
                set(state => ({
                    profile: state.profile ? { ...state.profile, avatar } : null,
                }));
            },

            // Wallet actions
            connectWallet: async () => {
                // Mock wallet connection (simulates real connection delay)
                await new Promise(resolve => setTimeout(resolve, 1500));

                const mockWallet = MOCK_WALLETS[Math.floor(Math.random() * MOCK_WALLETS.length)];

                const wallet: WalletData = {
                    address: mockWallet.full,
                    shortAddress: mockWallet.address,
                    chainName: 'TRON Mainnet',
                    chainId: 1,
                    balance: 100.00, // Mock TRX balance
                    gameBalance: 10.00, // Starting game balance
                    claimableRewards: 0,
                    transactions: [],
                };

                set({ wallet, isWalletConnected: true });
                return true;
            },

            disconnectWallet: () => {
                set({ wallet: null, isWalletConnected: false });
            },

            depositToGame: async (amount: number) => {
                const { wallet } = get();
                if (!wallet || wallet.balance < amount) return false;

                await new Promise(resolve => setTimeout(resolve, 1000));

                set(state => ({
                    wallet: state.wallet ? {
                        ...state.wallet,
                        balance: state.wallet.balance - amount,
                        gameBalance: state.wallet.gameBalance + amount,
                        transactions: [
                            {
                                id: `tx_${Date.now()}`,
                                type: 'deposit' as const,
                                amount,
                                timestamp: Date.now(),
                                status: 'confirmed' as const,
                            },
                            ...state.wallet.transactions,
                        ].slice(0, 50), // Keep last 50 transactions
                    } : null,
                }));
                return true;
            },

            withdrawFromGame: async (amount: number) => {
                const { wallet } = get();
                if (!wallet || wallet.gameBalance < amount) return false;

                await new Promise(resolve => setTimeout(resolve, 1000));

                set(state => ({
                    wallet: state.wallet ? {
                        ...state.wallet,
                        balance: state.wallet.balance + amount,
                        gameBalance: state.wallet.gameBalance - amount,
                        transactions: [
                            {
                                id: `tx_${Date.now()}`,
                                type: 'withdraw' as const,
                                amount,
                                timestamp: Date.now(),
                                status: 'confirmed' as const,
                            },
                            ...state.wallet.transactions,
                        ].slice(0, 50),
                    } : null,
                }));
                return true;
            },

            claimRewards: async () => {
                const { wallet } = get();
                if (!wallet || wallet.claimableRewards <= 0) return false;

                await new Promise(resolve => setTimeout(resolve, 1000));

                const rewardAmount = wallet.claimableRewards;
                set(state => ({
                    wallet: state.wallet ? {
                        ...state.wallet,
                        gameBalance: state.wallet.gameBalance + rewardAmount,
                        claimableRewards: 0,
                        transactions: [
                            {
                                id: `tx_${Date.now()}`,
                                type: 'reward_claim' as const,
                                amount: rewardAmount,
                                timestamp: Date.now(),
                                status: 'confirmed' as const,
                            },
                            ...state.wallet.transactions,
                        ].slice(0, 50),
                    } : null,
                }));
                return true;
            },

            // Gameplay actions
            payEntryFee: (amount: number) => {
                const { wallet } = get();
                if (!wallet || wallet.gameBalance < amount) return false;

                set(state => ({
                    wallet: state.wallet ? {
                        ...state.wallet,
                        gameBalance: state.wallet.gameBalance - amount,
                        transactions: [
                            {
                                id: `tx_${Date.now()}`,
                                type: 'entry_fee' as const,
                                amount: -amount,
                                timestamp: Date.now(),
                                status: 'confirmed' as const,
                            },
                            ...state.wallet.transactions,
                        ].slice(0, 50),
                    } : null,
                }));
                return true;
            },

            receiveWinnings: (amount: number) => {
                set(state => ({
                    wallet: state.wallet ? {
                        ...state.wallet,
                        gameBalance: state.wallet.gameBalance + amount,
                        transactions: [
                            {
                                id: `tx_${Date.now()}`,
                                type: 'winnings' as const,
                                amount,
                                timestamp: Date.now(),
                                status: 'confirmed' as const,
                            },
                            ...state.wallet.transactions,
                        ].slice(0, 50),
                    } : null,
                }));
            },

            recordMatch: (replay: MatchReplay) => {
                set(state => ({
                    matchHistory: [replay, ...state.matchHistory].slice(0, 100), // Keep last 100 matches
                }));
            },

            updateStatsAfterMatch: (mode: string, placement: number, profit: number, kills: number, totalPlayers: number) => {
                set(state => {
                    if (!state.profile) return state;

                    const isWin = placement === 1 || (totalPlayers > 4 && placement <= 3);
                    const newTotalMatches = state.profile.totalMatches + 1;
                    const newWins = state.profile.wins + (isWin ? 1 : 0);
                    const newLosses = newTotalMatches - newWins;
                    const newLifetimeProfit = state.profile.lifetimeProfit + profit;
                    const newPeakProfit = Math.max(state.profile.peakProfit, newLifetimeProfit);
                    const newStreak = isWin ? state.profile.currentStreak + 1 : 0;
                    const newBestStreak = Math.max(state.profile.bestStreak, newStreak);

                    // Update mode-specific stats
                    const modeStats = { ...state.profile.modeStats };
                    if (!modeStats[mode]) {
                        modeStats[mode] = { matches: 0, wins: 0, profit: 0, avgPlacement: 0 };
                    }
                    const ms = modeStats[mode];
                    const newModeMatches = ms.matches + 1;
                    modeStats[mode] = {
                        matches: newModeMatches,
                        wins: ms.wins + (isWin ? 1 : 0),
                        profit: ms.profit + profit,
                        avgPlacement: ((ms.avgPlacement * ms.matches) + placement) / newModeMatches,
                    };

                    return {
                        profile: {
                            ...state.profile,
                            totalMatches: newTotalMatches,
                            wins: newWins,
                            losses: newLosses,
                            lifetimeProfit: newLifetimeProfit,
                            peakProfit: newPeakProfit,
                            currentStreak: newStreak,
                            bestStreak: newBestStreak,
                            totalKills: state.profile.totalKills + kills,
                            modeStats,
                        },
                    };
                });
            },

            // Settings actions
            updateSettings: (newSettings: Partial<GameSettings>) => {
                set(state => ({
                    settings: { ...state.settings, ...newSettings },
                }));
            },

            resetSettings: () => {
                set({ settings: { ...defaultSettings } });
            },

            // On-chain sync (mock)
            syncOnChainStats: async () => {
                await new Promise(resolve => setTimeout(resolve, 2000));

                const { profile } = get();
                if (!profile) return;

                set({
                    onChainStats: {
                        totalMatchesVerified: profile.totalMatches,
                        tournamentWins: 0, // Would come from blockchain
                        lifetimeEarningsVerified: Math.max(0, profile.lifetimeProfit),
                        verifiedRank: profile.totalMatches > 50 ? 'Veteran' : profile.totalMatches > 20 ? 'Regular' : 'Newcomer',
                        lastSyncTime: Date.now(),
                        proofHash: `0x${Math.random().toString(16).slice(2, 18)}...`,
                    },
                });
            },

            // Getters
            canPlay: () => {
                const { isProfileComplete, isWalletConnected, wallet } = get();
                return isProfileComplete && isWalletConnected && wallet !== null && wallet.gameBalance > 0;
            },

            getReplayById: (id: string) => {
                return get().matchHistory.find(m => m.id === id);
            },
        }),
        {
            name: 'qron-profile-storage',
            partialize: (state) => ({
                profile: state.profile,
                isProfileComplete: state.isProfileComplete,
                wallet: state.wallet,
                isWalletConnected: state.isWalletConnected,
                onChainStats: state.onChainStats,
                matchHistory: state.matchHistory.slice(0, 50), // Only persist 50 matches for storage
                settings: state.settings,
            }),
        }
    )
);
