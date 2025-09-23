import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { config, queryClient } from './config/web3';
import AppContent from './AppContent';
import { Home } from './pages/Home';
import Marketplace from './pages/Marketplace';
import Create from './pages/Create';
import Profile from './pages/Profile';

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="text-white text-xl">Loading BlockMusic...</div>
          </div>}>
            <Router>
              <Routes>
                <Route path="/" element={<AppContent />}>
                  <Route index element={<Navigate to="/home" replace />} />
                  <Route path="home" element={<Home />} />
                  <Route path="marketplace" element={<Marketplace />} />
                  <Route path="create" element={<Create />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </Route>
              </Routes>
            </Router>
          </Suspense>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;