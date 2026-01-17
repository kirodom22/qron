import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameResult {
    gameId: string;
    mode: string;
    rank: number;
    totalPlayers: number;
    prize: number;
    entryFee: number;
    profit: number;
    survivalTime: number;
    kills: number;
    timestamp: number;
}

export interface WalletStats {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    totalProfit: number;
    winRate: number;
    avgSurvivalTime: number;
    avgKills: number;
    bestStreak: number;
    currentStreak: number;
    totalKills: number;
}

interface WalletState {
    // Wallet
    balance: number;
    address: string | null;
    isConnected: boolean;

    // Game history
    gameHistory: GameResult[];

    // Statistics
    stats: WalletStats;

    // Actions
    connectWallet: (address: string) => void;
    disconnectWallet: () => void;
    recordGameResult: (result: Omit<GameResult, 'timestamp'>) => void;
    deposit: (amount: number) => void;
    withdraw: (amount: number) => boolean;
    payEntryFee: (fee: number) => boolean;
    receiveWinnings: (amount: number) => void;
    resetStats: () => void;
}

const initialStats: WalletStats = {
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    totalProfit: 0,
    winRate: 0,
    avgSurvivalTime: 0,
    avgKills: 0,
    bestStreak: 0,
    currentStreak: 0,
    totalKills: 0,
};

export const useWalletStore = create<WalletState>()(
    persist(
        (set, get) => ({
            // Initial state
            balance: 10.00, // Start with $10 for testing
            address: null,
            isConnected: false,
            gameHistory: [],
            stats: { ...initialStats },

            connectWallet: (address: string) => {
                set({
                    address,
                    isConnected: true,
                });
            },

            disconnectWallet: () => {
                set({
                    address: null,
                    isConnected: false,
                });
            },

            deposit: (amount: number) => {
                set(state => ({
                    balance: state.balance + amount,
                }));
            },

            withdraw: (amount: number) => {
                const state = get();
                if (state.balance >= amount) {
                    set({ balance: state.balance - amount });
                    return true;
                }
                return false;
            },

            payEntryFee: (fee: number) => {
                const state = get();
                if (state.balance >= fee) {
                    set({ balance: state.balance - fee });
                    return true;
                }
                return false;
            },

            receiveWinnings: (amount: number) => {
                set(state => ({
                    balance: state.balance + amount,
                }));
            },

            recordGameResult: (result) => {
                const timestamp = Date.now();
                const fullResult: GameResult = { ...result, timestamp };

                set(state => {
                    const newHistory = [fullResult, ...state.gameHistory].slice(0, 100); // Keep last 100 games

                    // Calculate new stats
                    const totalGames = state.stats.totalGames + 1;
                    const isWin = result.rank === 1 || (result.totalPlayers > 4 && result.rank <= 3);
                    const totalWins = state.stats.totalWins + (isWin ? 1 : 0);
                    const totalLosses = totalGames - totalWins;
                    const totalProfit = state.stats.totalProfit + result.profit;
                    const winRate = (totalWins / totalGames) * 100;

                    const totalSurvivalTime = state.stats.avgSurvivalTime * state.stats.totalGames + result.survivalTime;
                    const avgSurvivalTime = totalSurvivalTime / totalGames;

                    const totalKills = state.stats.totalKills + result.kills;
                    const avgKills = totalKills / totalGames;

                    // Streak tracking
                    const currentStreak = isWin ? state.stats.currentStreak + 1 : 0;
                    const bestStreak = Math.max(state.stats.bestStreak, currentStreak);

                    return {
                        gameHistory: newHistory,
                        stats: {
                            totalGames,
                            totalWins,
                            totalLosses,
                            totalProfit,
                            winRate,
                            avgSurvivalTime,
                            avgKills,
                            bestStreak,
                            currentStreak,
                            totalKills,
                        },
                    };
                });
            },

            resetStats: () => {
                set({
                    gameHistory: [],
                    stats: { ...initialStats },
                });
            },
        }),
        {
            name: 'qron-wallet-storage', // localStorage key
            partialize: (state) => ({
                balance: state.balance,
                address: state.address,
                isConnected: state.isConnected,
                gameHistory: state.gameHistory,
                stats: state.stats,
            }),
        }
    )
);
