import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { WalletProvider } from './contexts/WalletContext';
import { useBlockchain } from './hooks/useBlockchain';
import { Home } from './pages/Home';

function AppContent() {
  console.log('AppContent component rendering');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { isConnected, isCorrectChain, switchToBaseSepolia } = useBlockchain();

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

  // Switch to Base Sepolia if connected to wrong network
  useEffect(() => {
    if (isConnected && !isCorrectChain) {
      switchToBaseSepolia();
    }
  }, [isConnected, isCorrectChain, switchToBaseSepolia]);

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-100">
        <Header 
          onLoginClick={handleLoginClick}
          onSignupClick={handleSignupClick}
        />
        <main className="flex-1">
          <Home />
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
  );
}

export default AppContent;
