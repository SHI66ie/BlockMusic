import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { Subscription as SubscriptionABI } from '../abis/Subscription';
import { parseEther, formatEther } from 'viem';

type SubscriptionPlan = 'daily' | 'monthly' | 'yearly' | null;

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionEnds: number | null;
  isLoading: boolean;
  error: string | null;
  subscribe: (plan: 'daily' | 'monthly' | 'yearly', paymentMethod: 'usdc' | 'eth') => Promise<void>;
  checkSubscription: () => Promise<{ isActive: boolean; endTime: number }>;
  subscriptionData: {
    dailyPrice: string;
    monthlyPrice: string;
    yearlyPrice: string;
    ethPrice: string;
    ethToUsd: number;
  };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Contract addresses (replace with your deployed contract addresses)
const SUBSCRIPTION_CONTRACT = '0x...'; // Replace with your deployed contract address
const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEnds, setSubscriptionEnds] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ethToUsd, setEthToUsd] = useState(2000); // Default fallback

  // Fetch subscription status
  const { refetch: refetchSubscription } = useContractRead({
    address: SUBSCRIPTION_CONTRACT,
    abi: SubscriptionABI,
    functionName: 'getSubscriptionStatus',
    args: [address],
    enabled: !!address,
    onSuccess: (data: any) => {
      const [isActive, endTime] = data;
      setIsSubscribed(isActive);
      setSubscriptionEnds(Number(endTime) * 1000); // Convert to milliseconds
    },
  });

  // Subscribe with USDC
  const { writeAsync: subscribeWithUSDC } = useContractWrite({
    address: SUBSCRIPTION_CONTRACT,
    abi: SubscriptionABI,
    functionName: 'subscribeWithUSDC',
  });

  // Subscribe with ETH
  const { writeAsync: subscribeWithETH } = useContractWrite({
    address: SUBSCRIPTION_CONTRACT,
    abi: SubscriptionABI,
    functionName: 'subscribeWithETH',
    value: parseEther('0.01'), // This will be overridden
  });

  // Approve USDC
  const { writeAsync: approveUSDC } = useContractWrite({
    address: USDC_CONTRACT,
    abi: [
      {
        constant: false,
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    functionName: 'approve',
  });

  // Get ETH price in USD (simplified)
  const getEthPrice = async () => {
    try {
      // In production, use Chainlink price feed
      // For now, we'll use a mock value
      return 2000 * 1e8; // $2000 with 8 decimals
    } catch (err) {
      console.error('Failed to fetch ETH price:', err);
      return 2000 * 1e8; // Fallback
    }
  };

  // Calculate prices
  const subscriptionData = {
    dailyPrice: '2.50', // $2.50 per day
    monthlyPrice: '25.00', // $25.00 per month (with 10% discount)
    yearlyPrice: '255.00', // $255.00 per year (with 15% discount)
    ethPrice: ethToUsd.toString(),
    ethToUsd,
  };

  // Check subscription status
  const checkSubscription = async () => {
    if (!address) return { isActive: false, endTime: 0 };
    
    try {
      const result = await refetchSubscription();
      const [isActive, endTime] = result.data || [false, 0];
      return { isActive, endTime: Number(endTime) * 1000 };
    } catch (err) {
      console.error('Error checking subscription:', err);
      return { isActive: false, endTime: 0 };
    }
  };

  // Subscribe to a plan
  const subscribe = async (plan: 'daily' | 'monthly' | 'yearly', paymentMethod: 'usdc' | 'eth') => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let planId;
      let amount;
      
      if (plan === 'daily') planId = 1;
      else if (plan === 'monthly') planId = 2;
      else planId = 3; // yearly

      if (paymentMethod === 'usdc') {
        // For USDC, we need to approve first
        const usdcAmount = plan === 'daily' 
          ? parseEther('25') // $25 for 30 days
          : plan === 'monthly'
            ? parseEther('25') // $25/month with 10% discount
            : parseEther('255'); // $255/year with 15% discount

        // Approve USDC
        await approveUSDC({
          args: [SUBSCRIPTION_CONTRACT, usdcAmount],
        });

        // Subscribe with USDC
        await subscribeWithUSDC({
          args: [planId],
        });
      } else {
        // For ETH, calculate required amount
        const usdAmount = plan === 'daily' 
          ? 25 // $25 for 30 days
          : plan === 'monthly'
            ? 25 // $25/month with 10% discount
            : 255; // $255/year with 15% discount

        const ethAmount = (usdAmount / ethToUsd).toFixed(6);
        
        // Subscribe with ETH
        await subscribeWithETH({
          value: parseEther(ethAmount),
          args: [planId],
        });
      }

      // Refresh subscription status
      await checkSubscription();
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to subscribe');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (address) {
      checkSubscription();
      getEthPrice().then(price => {
        setEthToUsd(Number(price) / 1e8);
      });
    }
  }, [address]);

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        subscriptionEnds,
        isLoading,
        error,
        subscribe,
        checkSubscription,
        subscriptionData,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
