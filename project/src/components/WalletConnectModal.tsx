import React, { useState } from 'react';
import { X, Wallet, AlertCircle, CheckCircle } from 'lucide-react';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletAddress: string) => void;
  userName?: string;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ 
  isOpen, 
  onClose, 
  onConnect,
  userName 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'intro' | 'connecting' | 'success'>('intro');

  const wallets = [
    {
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask browser extension',
      popular: true
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect using WalletConnect compatible wallets',
      popular: false
    },
    {
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Connect using Coinbase Wallet',
      popular: false
    }
  ];

  const handleWalletConnect = async (walletName: string) => {
    setIsConnecting(true);
    setError('');
    setStep('connecting');

    try {
      // Simulate wallet connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful wallet connection
      const mockAddress = '0x' + Math.random().toString(16).substr(2, 8) + '...' + 
                         Math.random().toString(16).substr(2, 4);
      setConnectedAddress(mockAddress);
      setStep('success');
      
      // Store wallet connection
      localStorage.setItem('connected_wallet', mockAddress);
      localStorage.setItem('wallet_provider', walletName);
      
    } catch (error) {
      setError('Failed to connect wallet. Please try again.');
      setStep('intro');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleContinue = () => {
    if (connectedAddress) {
      onConnect(connectedAddress);
      onClose();
    }
  };

  const handleSkip = () => {
    // Allow users to skip but with limited functionality
    localStorage.setItem('wallet_skipped', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="vinyl-card w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors duration-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {step === 'intro' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-neutral-400">
                {userName 
                  ? `Hi ${userName}, connect your wallet to access all BlockMusic features`
                  : 'Connect your wallet to access all BlockMusic features'
                }
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleWalletConnect(wallet.name)}
                  disabled={isConnecting}
                  className="w-full music-card-hover p-4 flex items-center space-x-4 text-left group"
                >
                  <div className="text-2xl">{wallet.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{wallet.name}</span>
                      {wallet.popular && (
                        <span className="badge-primary text-xs">Popular</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-400">{wallet.description}</p>
                  </div>
                  <div className="text-neutral-400 group-hover:text-white transition-colors">
                    →
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error-500/10 border border-error-500/30 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-error-400" />
                <span className="text-error-400 text-sm">{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-neutral-400 hover:text-neutral-300 text-sm transition-colors"
              >
                Skip for now
              </button>
              <div className="text-xs text-neutral-500">
                You can connect later in settings
              </div>
            </div>
          </div>
        )}

        {step === 'connecting' && (
          <div className="text-center py-8">
            <div className="animate-spin-slow mb-6">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Connecting Wallet...
            </h3>
            <p className="text-neutral-400">
              Please approve the connection request in your wallet
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-success-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-success-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Wallet Connected!
            </h3>
            <p className="text-neutral-400 mb-6">
              Connected address: <span className="font-mono text-primary-400">{connectedAddress}</span>
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full music-button"
              >
                Continue to BlockMusic
              </button>
              <button
                onClick={() => setStep('intro')}
                className="w-full music-button-ghost"
              >
                Connect Different Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnectModal;
