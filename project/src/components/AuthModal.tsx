import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Wallet } from 'lucide-react';
import { googleAuth, GoogleUser } from '../services/googleAuth';
import { emailAuth, EmailUser } from '../services/emailAuth';
import WalletConnectModal from './WalletConnectModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onSwitchMode: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode, onSwitchMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string>('');

  // Handle successful authentication and show wallet modal
  const handleAuthSuccess = (userName: string) => {
    setLoggedInUser(userName);
    setShowWalletModal(true);
  };

  // Initialize Google OAuth on mount
  useEffect(() => {
    if (isOpen) {
      googleAuth.init()
        .then(() => setGoogleInitialized(true))
        .catch(error => {
          console.error('Failed to initialize Google Auth:', error);
        });
    }
  }, [isOpen]);

  // Listen for auth events
  useEffect(() => {
    const handleGoogleSuccess = async (event: CustomEvent) => {
      const { user, token } = event.detail;
      setIsGoogleLoading(false);
      
      try {
        // Send Google auth data to backend
        const response = await emailAuth.linkGoogleAccount({
          googleId: user.id,
          email: user.email,
          displayName: user.name,
          photo: user.picture
        });
        
        if (response.success) {
          const userName = response.user?.displayName || user.name;
          handleAuthSuccess(userName);
        } else {
          alert(`Google ${mode} failed: ${response.error}`);
        }
      } catch (error) {
        alert(`Google ${mode} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    const handleGoogleError = (event: CustomEvent) => {
      setIsGoogleLoading(false);
      alert(`Google ${mode} failed: ${event.detail.error}`);
    };

    const handleEmailSuccess = (event: CustomEvent) => {
      const { user } = event.detail;
      const userName = user?.displayName || user?.email?.split('@')[0];
      handleAuthSuccess(userName);
    };

    window.addEventListener('googleAuthSuccess', handleGoogleSuccess as EventListener);
    window.addEventListener('googleAuthError', handleGoogleError as EventListener);
    window.addEventListener('emailAuthSuccess', handleEmailSuccess as EventListener);

    return () => {
      window.removeEventListener('googleAuthSuccess', handleGoogleSuccess as EventListener);
      window.removeEventListener('googleAuthError', handleGoogleError as EventListener);
      window.removeEventListener('emailAuthSuccess', handleEmailSuccess as EventListener);
    };
  }, [mode, handleAuthSuccess]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const response = await googleAuth.signIn();
      if (!response.success) {
        setIsGoogleLoading(false);
        alert(`Google ${mode} failed: ${response.error}`);
      }
    } catch (error) {
      setIsGoogleLoading(false);
      alert(`Google ${mode} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!formData.displayName) {
        newErrors.displayName = 'Display name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        let response;
        
        if (mode === 'signup') {
          response = await emailAuth.signup({
            displayName: formData.displayName,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword
          });
        } else {
          response = await emailAuth.login({
            email: formData.email,
            password: formData.password
          });
        }

        if (response.success) {
          const userName = response.user?.displayName || formData.email.split('@')[0];
          handleAuthSuccess(userName);
          
          // Reset form
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            displayName: '',
          });
        } else {
          alert(`${mode === 'login' ? 'Login' : 'Signup'} failed: ${response.error}`);
        }
      } catch (error) {
        alert(`${mode === 'login' ? 'Login' : 'Signup'} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful wallet connection
      alert(`Wallet ${mode === 'login' ? 'login' : 'signup'} successful! Connected to 0x1234...5678`);
      onClose();
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
      });
    } catch {
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle successful wallet connection
  const handleWalletConnected = (walletAddress: string) => {
    setShowWalletModal(false);
    onClose();
    // You can emit an event or call a parent callback here
    window.dispatchEvent(new CustomEvent('walletConnected', { 
      detail: { walletAddress, userName: loggedInUser } 
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="vinyl-card w-full max-w-md relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors duration-200"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' ? 'Log in to BlockMusic' : 'Sign up for free'}
            </h2>
            <p className="text-neutral-400">
              {mode === 'login' 
                ? 'Welcome back! Please enter your details.' 
                : 'Create your account to get started.'}
            </p>
          </div>

          {/* Social Login Section */}
          <div className="mb-8 space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || !googleInitialized}
              className="w-full music-button-secondary flex items-center justify-center space-x-3"
            >
              {isGoogleLoading ? (
                <div className="animate-spin-slow">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>
                {isGoogleLoading 
                  ? 'Connecting...' 
                  : `${mode === 'login' ? 'Login' : 'Sign up'} with Google`
                }
              </span>
            </button>

            <button
              onClick={handleWalletConnect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-500 hover:to-secondary-600 text-white py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed border border-secondary-500/30"
            >
              <Wallet className="w-5 h-5" />
              <span>
                {isConnecting 
                  ? 'Connecting...' 
                  : `${mode === 'login' ? 'Login' : 'Sign up'} with Wallet`
                }
              </span>
            </button>
            
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-neutral-600"></div>
              <span className="px-4 text-neutral-400 text-sm">or continue with email</span>
              <div className="flex-1 border-t border-neutral-600"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-neutral-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="music-input"
                  placeholder="Enter your display name"
                />
                {errors.displayName && (
                  <p className="text-error-400 text-sm mt-1">{errors.displayName}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="music-input"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-error-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="music-input pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-error-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="music-input"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-error-400 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full music-button"
            >
              {mode === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-neutral-400">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={onSwitchMode}
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors duration-200"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
      
      {/* Wallet Connection Modal */}
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletConnected}
        userName={loggedInUser}
      />
    </>
  );
};

export default AuthModal;
