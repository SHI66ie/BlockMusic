import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { Navbar } from './components/Navbar';
import { baseSepolia } from 'wagmi/chains';

function AppContent() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to home if on root path
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/home');
    }
  }, [location.pathname, navigate]);

  // Handle network switching
  useEffect(() => {
    if (isConnected && chainId !== baseSepolia.id) {
      console.warn(`Please switch to ${baseSepolia.name} network`);
      // Uncomment to automatically switch chains
      // switchChain({ chainId: baseSepolia.id });
    }
  }, [isConnected, chainId, switchChain]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppContent;
