import { useState, useEffect, Suspense } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { WalletProvider } from './contexts/WalletContext';
import { Web3Provider } from './components/Web3Provider';
import { useBlockchain } from './hooks/useBlockchain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './pages/Home';

// Create router
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
]);

// Create a client
const queryClient = new QueryClient();

function App() {
  console.log('App component rendering');
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

  console.log('Rendering with router:', router);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <WalletProvider>
          <div className="min-h-screen bg-gray-100">
            <Header 
              onLoginClick={handleLoginClick}
              onSignupClick={handleSignupClick}
            />
            <main className="flex-1">
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                <RouterProvider router={router} />
              </Suspense>
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