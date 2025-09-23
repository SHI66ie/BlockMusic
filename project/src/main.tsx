import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { config, queryClient } from './config/web3';
import styles from './App.module.css';
import './index.css';

console.log('Starting application...');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Failed to find root element');
  document.body.innerHTML = `
    <div style="color: white; background: #1a1a1a; padding: 2rem; font-family: sans-serif;">
      <h1>Error: Root element not found</h1>
      <p>Could not find an element with id="root" in the HTML.</p>
      <p>Please check if the index.html file contains a div with id="root".</p>
    </div>
  `;
} else {
  console.log('Root element found, rendering app...');
  
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider 
              theme={darkTheme({
                accentColor: '#7c3aed',
                accentColorForeground: 'white',
                borderRadius: 'medium',
                fontStack: 'system',
                overlayBlur: 'small',
              })}
              modalSize="compact"
            >
              <Suspense fallback={<div className={styles.loading}>Loading BlockMusic...</div>}>
                <App />
              </Suspense>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
