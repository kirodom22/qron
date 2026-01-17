import React, { useState } from 'react';
import {
    User, Wallet, Trophy, Target, TrendingUp, TrendingDown,
    Copy, Check, History,
    Play, Shield, RefreshCw, DollarSign, Award
} from 'lucide-react';
import { useProfileStore, MatchReplay } from '../store/profileStore';
import { ReplayViewer } from './ReplayViewer';

export const ProfileScreen: React.FC = () => {
    const {
        profile,
        wallet,
        isWalletConnected,
        onChainStats,
        matchHistory,
        settings,
        connectWallet,
        disconnectWallet,
        depositToGame,
        withdrawFromGame,
        claimRewards,
        syncOnChainStats,
        updateSettings,
    } = useProfileStore();

    const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'wallet' | 'settings'>('overview');
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [selectedReplay, setSelectedReplay] = useState<MatchReplay | null>(null);

    const handleConnectWallet = async () => {
        setIsConnecting(true);
        await connectWallet();
        setIsConnecting(false);
    };

    const handleCopyAddress = () => {
        if (wallet) {
            navigator.clipboard.writeText(wallet.address);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        await syncOnChainStats();
        setIsSyncing(false);
    };

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (amount > 0) {
            await depositToGame(amount);
            setDepositAmount('');
        }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (amount > 0) {
            await withdrawFromGame(amount);
            setWithdrawAmount('');
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!profile) {
        return <div className="p-8 text-center text-[#636366]">No profile found</div>;
    }

    const winRate = profile.totalMatches > 0
        ? ((profile.wins / profile.totalMatches) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-[#0c0c0e]">
            {/* Header */}
            <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #e5a530 0%, #d4941f 100%)',
                                color: '#0c0c0e'
                            }}
                        >
                            {profile.avatar.length === 1 ? profile.avatar : <User size={28} />}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{profile.name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                {isWalletConnected && wallet ? (
                                    <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 rounded-full bg-[#24d67a]" />
                                        <span className="text-[#a1a1a6]">{wallet.shortAddress}</span>
                                        <button onClick={handleCopyAddress} className="text-[#636366] hover:text-white">
                                            {copiedAddress ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-xs text-[#f05050]">Wallet not connected</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{profile.totalMatches}</div>
                            <div className="text-[10px] text-[#636366] uppercase">Matches</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#24d67a]">{winRate}%</div>
                            <div className="text-[10px] text-[#636366] uppercase">Win Rate</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${profile.lifetimeProfit >= 0 ? 'text-[#24d67a]' : 'text-[#f05050]'}`}>
                                {profile.lifetimeProfit >= 0 ? '+' : ''}${profile.lifetimeProfit.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-[#636366] uppercase">Profit</div>
                        </div>
                        {wallet && (
                            <div className="text-center pl-6 border-l border-[rgba(255,255,255,0.08)]">
                                <div className="text-2xl font-bold text-[#e5a530]">${wallet.gameBalance.toFixed(2)}</div>
                                <div className="text-[10px] text-[#636366] uppercase">Balance</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-6">
                    {(['overview', 'matches', 'wallet', 'settings'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-[rgba(229,165,48,0.15)] text-[#e5a530]'
                                : 'text-[#636366] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-3 gap-6">
                        {/* Stats Card */}
                        <div className="col-span-2 bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Trophy size={16} className="text-[#e5a530]" />
                                Performance Stats
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                <StatBox label="Wins" value={profile.wins.toString()} color="text-[#24d67a]" />
                                <StatBox label="Losses" value={profile.losses.toString()} color="text-[#f05050]" />
                                <StatBox label="Best Streak" value={profile.bestStreak.toString()} color="text-[#e5a530]" />
                                <StatBox label="Total Kills" value={profile.totalKills.toString()} color="text-white" />
                                <StatBox label="Peak Profit" value={`$${profile.peakProfit.toFixed(2)}`} color="text-[#24d67a]" />
                                <StatBox label="Current Streak" value={profile.currentStreak.toString()} color="text-[#e5a530]" />
                                <StatBox
                                    label="Avg Placement"
                                    value={profile.totalMatches > 0 ?
                                        (Object.values(profile.modeStats).reduce((a, b) => a + b.avgPlacement * b.matches, 0) /
                                            profile.totalMatches).toFixed(1) : '-'
                                    }
                                    color="text-white"
                                />
                                <StatBox
                                    label="Profit/Match"
                                    value={profile.totalMatches > 0 ?
                                        `$${(profile.lifetimeProfit / profile.totalMatches).toFixed(2)}` : '-'
                                    }
                                    color={profile.lifetimeProfit >= 0 ? 'text-[#24d67a]' : 'text-[#f05050]'}
                                />
                            </div>
                        </div>

                        {/* On-Chain Stats */}
                        <div className="bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Shield size={16} className="text-[#24d67a]" />
                                    On-Chain Stats
                                </h3>
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className="text-[10px] text-[#636366] hover:text-white flex items-center gap-1"
                                >
                                    <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                                    Sync
                                </button>
                            </div>
                            {onChainStats ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-[#636366]">Verified Matches</span>
                                        <span className="text-sm font-medium text-white">{onChainStats.totalMatchesVerified}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-[#636366]">Lifetime Earnings</span>
                                        <span className="text-sm font-medium text-[#24d67a]">${onChainStats.lifetimeEarningsVerified.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-[#636366]">Verified Rank</span>
                                        <span className="text-sm font-medium text-[#e5a530]">{onChainStats.verifiedRank}</span>
                                    </div>
                                    <div className="mt-4 p-2 bg-[rgba(0,0,0,0.3)] rounded text-[9px] text-[#636366] font-mono break-all">
                                        Proof: {onChainStats.proofHash}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-[#636366] text-sm">
                                    Click sync to verify stats
                                </div>
                            )}
                        </div>

                        {/* Mode Stats */}
                        <div className="col-span-3 bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Target size={16} className="text-[#e5a530]" />
                                Performance by Mode
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                {Object.entries(profile.modeStats).length > 0 ? (
                                    Object.entries(profile.modeStats).map(([mode, stats]) => (
                                        <div key={mode} className="bg-[rgba(0,0,0,0.3)] rounded-lg p-4">
                                            <div className="text-sm font-semibold text-[#e5a530] mb-2">{mode.toUpperCase()}</div>
                                            <div className="space-y-1 text-[11px]">
                                                <div className="flex justify-between">
                                                    <span className="text-[#636366]">Matches</span>
                                                    <span className="text-white">{stats.matches}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[#636366]">Wins</span>
                                                    <span className="text-[#24d67a]">{stats.wins}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[#636366]">Profit</span>
                                                    <span className={stats.profit >= 0 ? 'text-[#24d67a]' : 'text-[#f05050]'}>
                                                        {stats.profit >= 0 ? '+' : ''}${stats.profit.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-4 text-center py-8 text-[#636366] text-sm">
                                        Play some matches to see mode stats
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Matches Tab */}
                {activeTab === 'matches' && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <History size={16} className="text-[#e5a530]" />
                            Match History ({matchHistory.length} matches)
                        </h3>
                        {matchHistory.length > 0 ? (
                            matchHistory.map(match => (
                                <MatchHistoryCard
                                    key={match.id}
                                    match={match}
                                    onViewReplay={() => setSelectedReplay(match)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 text-[#636366]">
                                No matches played yet
                            </div>
                        )}
                    </div>
                )}

                {/* Replay Viewer Modal */}
                {selectedReplay && (
                    <ReplayViewer
                        replay={selectedReplay}
                        onClose={() => setSelectedReplay(null)}
                    />
                )}

                {/* Wallet Tab */}
                {activeTab === 'wallet' && (
                    <div className="grid grid-cols-2 gap-6">
                        {/* Wallet Connection */}
                        <div className="bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Wallet size={16} className="text-[#e5a530]" />
                                Wallet Connection
                            </h3>
                            {isWalletConnected && wallet ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-[rgba(36,214,122,0.1)] rounded-lg border border-[rgba(36,214,122,0.2)]">
                                        <div className="w-2 h-2 rounded-full bg-[#24d67a]" />
                                        <div className="flex-1">
                                            <div className="text-xs text-[#24d67a] font-medium">Connected</div>
                                            <div className="text-[10px] text-[#a1a1a6] font-mono">{wallet.shortAddress}</div>
                                        </div>
                                        <button onClick={handleCopyAddress} className="text-[#636366] hover:text-white">
                                            {copiedAddress ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-[#636366]">Chain</span>
                                        <span className="text-sm text-white">{wallet.chainName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-[#636366]">Wallet Balance</span>
                                        <span className="text-sm text-white">${wallet.balance.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-[#636366]">Game Balance</span>
                                        <span className="text-sm font-bold text-[#e5a530]">${wallet.gameBalance.toFixed(2)}</span>
                                    </div>
                                    {wallet.claimableRewards > 0 && (
                                        <button
                                            onClick={claimRewards}
                                            className="w-full py-2 rounded-lg bg-[rgba(36,214,122,0.15)] text-[#24d67a] text-sm font-medium hover:bg-[rgba(36,214,122,0.25)]"
                                        >
                                            Claim ${wallet.claimableRewards.toFixed(2)} Rewards
                                        </button>
                                    )}
                                    <button
                                        onClick={disconnectWallet}
                                        className="w-full py-2 rounded-lg bg-[rgba(240,80,80,0.1)] text-[#f05050] text-sm hover:bg-[rgba(240,80,80,0.2)]"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Wallet size={32} className="mx-auto mb-4 text-[#636366]" />
                                    <p className="text-sm text-[#636366] mb-4">Connect your wallet to play</p>
                                    <button
                                        onClick={handleConnectWallet}
                                        disabled={isConnecting}
                                        className="px-6 py-3 rounded-lg bg-[#e5a530] text-[#0c0c0e] font-semibold hover:bg-[#d4941f]"
                                    >
                                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Deposit/Withdraw */}
                        <div className="bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <DollarSign size={16} className="text-[#e5a530]" />
                                Manage Funds
                            </h3>
                            {isWalletConnected && wallet ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-[#636366] uppercase block mb-2">Deposit to Game</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={depositAmount}
                                                onChange={e => setDepositAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="flex-1 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white text-sm"
                                            />
                                            <button
                                                onClick={handleDeposit}
                                                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                                                className="px-4 py-2 rounded-lg bg-[#24d67a] text-[#0c0c0e] font-medium text-sm hover:bg-[#1db864] disabled:opacity-50"
                                            >
                                                Deposit
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[#636366] uppercase block mb-2">Withdraw from Game</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={withdrawAmount}
                                                onChange={e => setWithdrawAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="flex-1 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white text-sm"
                                            />
                                            <button
                                                onClick={handleWithdraw}
                                                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                                                className="px-4 py-2 rounded-lg bg-[#e5a530] text-[#0c0c0e] font-medium text-sm hover:bg-[#d4941f] disabled:opacity-50"
                                            >
                                                Withdraw
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-[#636366] text-sm">
                                    Connect wallet first
                                </div>
                            )}
                        </div>

                        {/* Transaction History */}
                        <div className="col-span-2 bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <History size={16} className="text-[#e5a530]" />
                                Transaction History
                            </h3>
                            {wallet && wallet.transactions.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {wallet.transactions.map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between p-3 bg-[rgba(0,0,0,0.2)] rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'winnings' || tx.type === 'reward_claim' ? 'bg-[rgba(36,214,122,0.15)]' :
                                                    tx.type === 'entry_fee' ? 'bg-[rgba(240,80,80,0.15)]' :
                                                        'bg-[rgba(229,165,48,0.15)]'
                                                    }`}>
                                                    {tx.type === 'winnings' ? <TrendingUp size={14} className="text-[#24d67a]" /> :
                                                        tx.type === 'entry_fee' ? <TrendingDown size={14} className="text-[#f05050]" /> :
                                                            tx.type === 'deposit' ? <Wallet size={14} className="text-[#e5a530]" /> :
                                                                tx.type === 'withdraw' ? <Wallet size={14} className="text-[#e5a530]" /> :
                                                                    <Award size={14} className="text-[#24d67a]" />}
                                                </div>
                                                <div>
                                                    <div className="text-sm text-white capitalize">{tx.type.replace('_', ' ')}</div>
                                                    <div className="text-[10px] text-[#636366]">{formatTime(tx.timestamp)}</div>
                                                </div>
                                            </div>
                                            <div className={`text-sm font-medium ${tx.amount >= 0 ? 'text-[#24d67a]' : 'text-[#f05050]'}`}>
                                                {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-[#636366] text-sm">
                                    No transactions yet
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="grid grid-cols-2 gap-6">
                        {/* Camera Settings */}
                        <div className="bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-sm font-semibold text-white mb-4">Camera</h3>
                            <div className="space-y-4">
                                <SettingSlider
                                    label="Zoom"
                                    value={settings.cameraZoom}
                                    min={0.5}
                                    max={2}
                                    step={0.1}
                                    onChange={v => updateSettings({ cameraZoom: v })}
                                />
                                <SettingSlider
                                    label="Smoothing"
                                    value={settings.cameraSmoothing}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    onChange={v => updateSettings({ cameraSmoothing: v })}
                                />
                            </div>
                        </div>

                        {/* Accessibility */}
                        <div className="bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-sm font-semibold text-white mb-4">Accessibility</h3>
                            <div className="space-y-4">
                                <SettingSelect
                                    label="Colorblind Mode"
                                    value={settings.colorblindMode}
                                    options={[
                                        { value: 'none', label: 'None' },
                                        { value: 'protanopia', label: 'Protanopia' },
                                        { value: 'deuteranopia', label: 'Deuteranopia' },
                                        { value: 'tritanopia', label: 'Tritanopia' },
                                    ]}
                                    onChange={v => updateSettings({ colorblindMode: v as any })}
                                />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-sm font-semibold text-white mb-4">Controls</h3>
                            <div className="space-y-4">
                                <SettingToggle
                                    label="Turn Buffering"
                                    description="Queue next turn before current completes"
                                    checked={settings.turnBuffering}
                                    onChange={v => updateSettings({ turnBuffering: v })}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(settings.keyBindings).map(([action, key]) => (
                                        <div key={action} className="flex items-center justify-between p-2 bg-[rgba(0,0,0,0.3)] rounded">
                                            <span className="text-[11px] text-[#636366] capitalize">{action}</span>
                                            <span className="text-xs text-white font-mono">{key}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Graphics */}
                        <div className="bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-sm font-semibold text-white mb-4">Graphics</h3>
                            <div className="space-y-4">
                                <SettingSelect
                                    label="Graphics Level"
                                    value={settings.graphicsLevel}
                                    options={[
                                        { value: 'low', label: 'Low' },
                                        { value: 'medium', label: 'Medium' },
                                        { value: 'high', label: 'High' },
                                    ]}
                                    onChange={v => updateSettings({ graphicsLevel: v as any })}
                                />
                                <SettingToggle
                                    label="Trail Glow"
                                    checked={settings.showTrailGlow}
                                    onChange={v => updateSettings({ showTrailGlow: v })}
                                />
                                <SettingToggle
                                    label="Particles"
                                    checked={settings.showParticles}
                                    onChange={v => updateSettings({ showParticles: v })}
                                />
                            </div>
                        </div>

                        {/* Network */}
                        <div className="col-span-2 bg-[#111114] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
                            <h3 className="text-sm font-semibold text-white mb-4">Network</h3>
                            <div className="flex gap-6">
                                <SettingToggle
                                    label="Show Network Stats"
                                    description="Display ping and tick rate"
                                    checked={settings.showNetworkStats}
                                    onChange={v => updateSettings({ showNetworkStats: v })}
                                />
                                <SettingToggle
                                    label="Show FPS"
                                    checked={settings.showFPS}
                                    onChange={v => updateSettings({ showFPS: v })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-components
const StatBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-3">
        <div className={`text-lg font-bold ${color}`}>{value}</div>
        <div className="text-[10px] text-[#636366] uppercase">{label}</div>
    </div>
);

const MatchHistoryCard: React.FC<{ match: MatchReplay; onViewReplay?: () => void }> = ({ match, onViewReplay }) => {
    const isWin = match.userPlacement === 1 || (match.players.length > 4 && match.userPlacement <= 3);

    return (
        <div className={`p-4 rounded-lg border ${isWin ? 'bg-[rgba(36,214,122,0.05)] border-[rgba(36,214,122,0.2)]' : 'bg-[rgba(240,80,80,0.05)] border-[rgba(240,80,80,0.2)]'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${isWin ? 'bg-[rgba(36,214,122,0.15)] text-[#24d67a]' : 'bg-[rgba(240,80,80,0.15)] text-[#f05050]'
                        }`}>
                        #{match.userPlacement}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-white">
                            {match.modeName} • {match.players.length} players
                        </div>
                        <div className="text-[10px] text-[#636366]">
                            {new Date(match.timestamp).toLocaleDateString()} • {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className={`text-sm font-bold ${match.userProfit >= 0 ? 'text-[#24d67a]' : 'text-[#f05050]'}`}>
                            {match.userProfit >= 0 ? '+' : ''}${match.userProfit.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#636366]">profit</div>
                    </div>
                    <button
                        onClick={onViewReplay}
                        className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#636366] hover:text-white"
                        title="View Replay"
                    >
                        <Play size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const SettingSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <div>
        <div className="flex justify-between mb-2">
            <span className="text-[11px] text-[#636366]">{label}</span>
            <span className="text-xs text-white">{value.toFixed(1)}</span>
        </div>
        <input
            type="range"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-[rgba(255,255,255,0.1)] rounded-lg appearance-none cursor-pointer accent-[#e5a530]"
        />
    </div>
);

const SettingToggle: React.FC<{
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <div>
            <div className="text-sm text-white">{label}</div>
            {description && <div className="text-[10px] text-[#636366]">{description}</div>}
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-[#e5a530]' : 'bg-[rgba(255,255,255,0.1)]'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${checked ? 'translate-x-4' : ''}`} />
        </button>
    </div>
);

const SettingSelect: React.FC<{
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
    <div>
        <label className="text-[11px] text-[#636366] block mb-2">{label}</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-white text-sm"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);
