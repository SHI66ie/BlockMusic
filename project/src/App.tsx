import React, { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { WalletProvider } from './contexts/WalletContext';

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

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-100">
        <Header 
          onLoginClick={handleLoginClick}
          onSignupClick={handleSignupClick}
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
  );
}

export default App;