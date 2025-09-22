import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { WalletProvider } from './contexts/WalletContext';
import { Web3Provider } from './components/Web3Provider';
import { WalletButton } from './components/WalletButton';
import { useBlockchain } from './hooks/useBlockchain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleLoginClick = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const handleSignupClick = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleSwitchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  const handleCloseModal = () => {
    setIsAuthModalOpen(false);
  };

  const { isConnected, isCorrectChain, switchToBaseSepolia } = useBlockchain();

  // Switch to Base Sepolia if connected to wrong network
  useEffect(() => {
    if (isConnected && !isCorrectChain) {
      switchToBaseSepolia();
    }
  }, [isConnected, isCorrectChain, switchToBaseSepolia]);

  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <WalletProvider>
          <div className="min-h-screen bg-gray-100">
            <Header 
              onLoginClick={handleLoginClick}
              onSignupClick={handleSignupClick}
              rightContent={
                <div className="flex items-center space-x-4">
                  <WalletButton />
                  {isConnected && !isCorrectChain && (
                    <button
                      onClick={switchToBaseSepolia}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Switch to Base Sepolia
                    </button>
                  )}
                </div>
              }
            />
            <main className="flex-1">
              <RouterProvider router={router} />
            </main>

            <Footer />

            <AuthModal
              isOpen={isAuthModalOpen}
              mode={authMode}
              onClose={handleCloseModal}
              onSwitchMode={handleSwitchAuthMode}
            />
          </div>
        </WalletProvider>
      </Web3Provider>
    </QueryClientProvider>
  );
}

export default App;