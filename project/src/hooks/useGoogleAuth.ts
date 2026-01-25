import { useState, useEffect } from 'react';
import { googleAuth, GoogleUser } from '../services/googleAuth';

export interface UseGoogleAuthReturn {
  user: GoogleUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  initialize: () => Promise<void>;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Google Auth and check for existing session
  const initialize = async () => {
    try {
      await googleAuth.init();
      
      // Check if user is already authenticated
      if (googleAuth.isAuthenticated()) {
        const currentUser = googleAuth.getCurrentUser();
        setUser(currentUser);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      setIsInitialized(true);
    }
  };

  // Sign in with Google
  const signIn = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isInitialized) {
      return { success: false, error: 'Google Auth not initialized' };
    }

    setIsLoading(true);
    try {
      const response = await googleAuth.signIn();
      
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Sign in failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = () => {
    googleAuth.signOut();
    setUser(null);
  };

  // Listen for auth events
  useEffect(() => {
    const handleAuthSuccess = (event: CustomEvent) => {
      const { user: authUser } = event.detail;
      setUser(authUser);
      setIsLoading(false);
    };

    const handleAuthError = (event: CustomEvent) => {
      setIsLoading(false);
    };

    const handleSignOut = () => {
      setUser(null);
    };

    window.addEventListener('googleAuthSuccess', handleAuthSuccess as EventListener);
    window.addEventListener('googleAuthError', handleAuthError as EventListener);
    window.addEventListener('googleAuthSignOut', handleSignOut);

    return () => {
      window.removeEventListener('googleAuthSuccess', handleAuthSuccess as EventListener);
      window.removeEventListener('googleAuthError', handleAuthError as EventListener);
      window.removeEventListener('googleAuthSignOut', handleSignOut);
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user && googleAuth.isAuthenticated(),
    signIn,
    signOut,
    initialize,
  };
};
