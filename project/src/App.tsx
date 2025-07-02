import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Premium from './components/Premium';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { WalletProvider } from './contexts/WalletContext';
import Wallet from './components/Wallet';

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
        
        <main>
          <Hero />
          <Features />
          <Premium />
          <Wallet />
        </main>

        <Footer />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={handleCloseModal}
          mode={authMode}
          onSwitchMode={handleSwitchAuthMode}
        />
      </div>
    </WalletProvider>
  );
}

export default App;