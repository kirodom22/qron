import React from 'react';

export const Footer: React.FC = () => {
  return (
    <div
      className="h-5 flex items-center overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)'
      }}
    >
      <div className="animate-marquee whitespace-nowrap text-[9px] text-[var(--text-muted)] flex gap-8 px-4">
        <span>Network: TRON Mainnet</span>
        <span>Latency: 12ms</span>
        <span>Contract: Verified</span>
        <span>Payout: Instant</span>
        <span>Network: TRON Mainnet</span>
        <span>Latency: 12ms</span>
        <span>Contract: Verified</span>
        <span>Payout: Instant</span>
      </div>
    </div>
  );
};
