import React, { ReactNode } from 'react';
import { WagmiConfig } from 'wagmi';
import { config } from '../config/web3';

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiConfig config={config}>
      {children}
    </WagmiConfig>
  );
}
