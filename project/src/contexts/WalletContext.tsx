import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { WalletContextType, WALLET_API_BASE_URL } from '../types/wallet.types';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBalance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(WALLET_API_BASE_URL);
      setBalance(response.data.balance);
    } catch (err) {
      setError('Failed to fetch balance');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const makeTransaction = async (amount: number) => {
    try {
      setIsLoading(true);
      setError(null);
      await axios.post(`${WALLET_API_BASE_URL}/deposit`, { amount });
      await getBalance(); // Refresh balance after transaction
    } catch (err) {
      setError('Transaction failed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getBalance();
  }, []);



  return (
    <WalletContext.Provider
      value={{
        balance,
        isLoading,
        error,
        getBalance,
        makeTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
