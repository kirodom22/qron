import React, { useState } from 'react';
import { Wallet, Zap, ArrowRight, Shield, Trophy, User } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';

interface Props {
    onComplete: () => void;
}

export const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
    const {
        profile,
        isProfileComplete,
        isWalletConnected,
        wallet,
        createProfile,
        connectWallet,
    } = useProfileStore();

    const [step, setStep] = useState<'name' | 'wallet' | 'deposit'>('name');
    const [playerName, setPlayerName] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    const handleCreateProfile = () => {
        if (playerName.trim().length < 2) {
            setError('Name must be at least 2 characters');
            return;
        }
        if (playerName.trim().length > 16) {
            setError('Name must be 16 characters or less');
            return;
        }
        createProfile(playerName.trim());
        setError('');
        setStep('wallet');
    };

    const handleConnectWallet = async () => {
        setIsConnecting(true);
        setError('');
        try {
            await connectWallet();
            setStep('deposit');
        } catch (e) {
            setError('Failed to connect wallet. Please try again.');
        }
        setIsConnecting(false);
    };

    const handleComplete = () => {
        if (wallet && wallet.gameBalance > 0) {
            onComplete();
        } else {
            setError('You need funds to play. Deposit at least $0.50.');
        }
    };

    // If already set up, allow proceeding
    if (isProfileComplete && isWalletConnected && wallet && wallet.gameBalance > 0) {
        return (
            <div className="fixed inset-0 bg-[#0c0c0e] flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-xl bg-[rgba(229,165,48,0.15)] flex items-center justify-center mx-auto mb-6">
                        <Zap size={32} className="text-[#e5a530]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome back, {profile?.name}!</h1>
                    <p className="text-[#636366] mb-8">Ready to ride the grid?</p>
                    <button
                        onClick={onComplete}
                        className="px-8 py-4 rounded-xl bg-[#e5a530] text-[#0c0c0e] font-bold text-lg flex items-center gap-3 mx-auto hover:bg-[#d4941f] transition-all"
                    >
                        Enter Arena
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0c0c0e] flex items-center justify-center z-50">
            <div className="max-w-lg w-full mx-4">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-wider mb-2">
                        <span className="text-white">QR</span>
                        <span style={{ color: '#e5a530' }}>ON</span>
                    </h1>
                    <p className="text-[#636366] text-sm">Lightcycle Arena • Play to Earn</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {['name', 'wallet', 'deposit'].map((s, i) => (
                        <React.Fragment key={s}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === s
                                    ? 'bg-[#e5a530] text-[#0c0c0e]'
                                    : (step === 'wallet' && s === 'name') || (step === 'deposit' && i < 2)
                                        ? 'bg-[#24d67a] text-[#0c0c0e]'
                                        : 'bg-[rgba(255,255,255,0.1)] text-[#636366]'
                                    }`}
                            >
                                {i + 1}
                            </div>
                            {i < 2 && <div className="w-8 h-0.5 bg-[rgba(255,255,255,0.1)]" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Card */}
                <div
                    className="rounded-2xl p-8 border"
                    style={{
                        background: 'linear-gradient(180deg, #18181c 0%, #111114 100%)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                >
                    {/* Step 1: Create Profile */}
                    {step === 'name' && (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-xl bg-[rgba(229,165,48,0.15)] flex items-center justify-center mx-auto mb-4">
                                    <User size={32} className="text-[#e5a530]" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Create Your Identity</h2>
                                <p className="text-[#636366] text-sm">Choose a name for the arena</p>
                            </div>

                            <div className="mb-6">
                                <label className="text-[10px] text-[#636366] uppercase block mb-2">Player Name</label>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={e => setPlayerName(e.target.value)}
                                    placeholder="Enter your name..."
                                    maxLength={16}
                                    className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-lg focus:border-[#e5a530] focus:outline-none transition-colors"
                                />
                                <div className="text-right text-[10px] text-[#636366] mt-1">
                                    {playerName.length}/16
                                </div>
                            </div>

                            {/* Preview Avatar */}
                            {playerName && (
                                <div className="flex items-center gap-4 p-4 bg-[rgba(0,0,0,0.3)] rounded-xl mb-6">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                                        style={{ background: 'linear-gradient(135deg, #e5a530 0%, #d4941f 100%)', color: '#0c0c0e' }}
                                    >
                                        {playerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{playerName}</div>
                                        <div className="text-[10px] text-[#636366]">Your arena identity</div>
                                    </div>
                                </div>
                            )}

                            {error && <div className="text-[#f05050] text-sm text-center mb-4">{error}</div>}

                            <button
                                onClick={handleCreateProfile}
                                disabled={!playerName.trim()}
                                className="w-full py-4 rounded-xl bg-[#e5a530] text-[#0c0c0e] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#d4941f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                                <ArrowRight size={18} />
                            </button>
                        </>
                    )}

                    {/* Step 2: Connect Wallet */}
                    {step === 'wallet' && (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-xl bg-[rgba(229,165,48,0.15)] flex items-center justify-center mx-auto mb-4">
                                    <Wallet size={32} className="text-[#e5a530]" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Connect Wallet</h2>
                                <p className="text-[#636366] text-sm">Required to play and earn rewards</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 p-3 bg-[rgba(0,0,0,0.3)] rounded-lg">
                                    <Shield size={16} className="text-[#24d67a]" />
                                    <span className="text-sm text-[#a1a1a6]">Secure on-chain transactions</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-[rgba(0,0,0,0.3)] rounded-lg">
                                    <Trophy size={16} className="text-[#e5a530]" />
                                    <span className="text-sm text-[#a1a1a6]">Win real crypto rewards</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-[rgba(0,0,0,0.3)] rounded-lg">
                                    <Zap size={16} className="text-[#38bdf8]" />
                                    <span className="text-sm text-[#a1a1a6]">Instant payouts to wallet</span>
                                </div>
                            </div>

                            {error && <div className="text-[#f05050] text-sm text-center mb-4">{error}</div>}

                            <button
                                onClick={handleConnectWallet}
                                disabled={isConnecting}
                                className="w-full py-4 rounded-xl bg-[#e5a530] text-[#0c0c0e] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#d4941f] transition-colors disabled:opacity-50"
                            >
                                {isConnecting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-[#0c0c0e] border-t-transparent rounded-full animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Wallet size={18} />
                                        Connect Wallet
                                    </>
                                )}
                            </button>

                            <p className="text-[10px] text-[#636366] text-center mt-4">
                                By connecting, you agree to our Terms of Service
                            </p>
                        </>
                    )}

                    {/* Step 3: Ready to Play */}
                    {step === 'deposit' && wallet && (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-xl bg-[rgba(36,214,122,0.15)] flex items-center justify-center mx-auto mb-4">
                                    <Zap size={32} className="text-[#24d67a]" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Ready to Play!</h2>
                                <p className="text-[#636366] text-sm">Your wallet is connected</p>
                            </div>

                            <div className="p-4 bg-[rgba(36,214,122,0.1)] rounded-xl border border-[rgba(36,214,122,0.2)] mb-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-[#24d67a]" />
                                    <span className="text-sm text-[#24d67a] font-medium">Wallet Connected</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] text-[#636366]">Address</span>
                                    <span className="text-sm text-white font-mono">{wallet.shortAddress}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] text-[#636366]">Chain</span>
                                    <span className="text-sm text-white">{wallet.chainName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-[#636366]">Game Balance</span>
                                    <span className="text-lg font-bold text-[#e5a530]">${wallet.gameBalance.toFixed(2)}</span>
                                </div>
                            </div>

                            {wallet.gameBalance <= 0 && (
                                <div className="p-4 bg-[rgba(229,165,48,0.1)] rounded-xl border border-[rgba(229,165,48,0.2)] mb-6">
                                    <p className="text-sm text-[#e5a530] text-center">
                                        You need to deposit funds to play. Minimum $0.50 for 1v1 matches.
                                    </p>
                                </div>
                            )}

                            {error && <div className="text-[#f05050] text-sm text-center mb-4">{error}</div>}

                            <button
                                onClick={handleComplete}
                                disabled={wallet.gameBalance <= 0}
                                className="w-full py-4 rounded-xl bg-[#e5a530] text-[#0c0c0e] font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#d4941f] transition-colors disabled:opacity-50"
                            >
                                Enter Arena
                                <ArrowRight size={18} />
                            </button>

                            {wallet.gameBalance <= 0 && (
                                <p className="text-[10px] text-[#636366] text-center mt-4">
                                    Go to Profile → Wallet tab to deposit funds
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Skip to profile if returning user */}
                {step !== 'name' && (
                    <button
                        onClick={() => setStep('name')}
                        className="w-full mt-4 py-2 text-[#636366] text-sm hover:text-white"
                    >
                        Go back
                    </button>
                )}
            </div>
        </div>
    );
};
