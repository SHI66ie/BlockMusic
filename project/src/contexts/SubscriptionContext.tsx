import React, { createContext, useEffect, useState, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
// parseEther is kept for future use
import { toast } from 'react-toastify';

// Import ABI
import { SubscriptionManager as SubscriptionManagerABI } from '../abis/SubscriptionManager';
import { MockUSDC as MockUSDCABI } from '../abis/MockUSDC';
import { 
  SUBSCRIPTION_CONTRACT,
  PLAN_TO_ENUM,
  ENUM_TO_PLAN
} from '../constants/subscription';

export type SubscriptionPlan = 'daily' | 'monthly' | 'yearly' | null;

export interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionEnds: number | null;
  currentPlan: SubscriptionPlan;
  isLoading: boolean;
  error: string | null;
  subscribe: (plan: 'daily' | 'monthly' | 'yearly', paymentMethod?: 'usdc' | 'eth') => Promise<void>;
  checkSubscription: () => Promise<{ isActive: boolean; endTime: number; plan: SubscriptionPlan }>;
  subscriptionData: {
    dailyPrice: string;
    monthlyPrice: string;
    yearlyPrice: string;
  };
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEnds, setSubscriptionEnds] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(null);
  const [ethToUsd, setEthToUsd] = useState(2000); // Default ETH to USD rate
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usdcAddress, setUsdcAddress] = useState<string>('');

  // Contract instances
  const subscriptionContract = {
    address: SUBSCRIPTION_CONTRACT as `0x${string}`,
    abi: SubscriptionManagerABI,
  };

  // Get subscription status
  const { refetch } = useContractRead({
    ...subscriptionContract,
    functionName: 'isSubscribed',
    args: [address],
    enabled: !!address,
  });

  // USDC approval
  const { writeAsync: approveUSDC } = useContractWrite({
    address: usdcAddress as `0x${string}`,
    abi: MockUSDCABI,
    functionName: 'approve',
  });

  // Subscribe function
  const { writeAsync: subscribe } = useContractWrite({
    ...subscriptionContract,
    functionName: 'subscribe',
  });

  // Get ETH to USD price
  const getEthPrice = useCallback(async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      setEthToUsd(data.ethereum.usd);
      return data.ethereum.usd;
    } catch (err) {
      console.error('Error fetching ETH price:', err);
      // Fallback to default value
      setEthToUsd(2000);
      return 2000;
    }
  }, []);

  // Get subscription price in wei
  const getSubscriptionPrice = useCallback((plan: 'daily' | 'monthly' | 'yearly'): string => {
    const pricesInEth = {
      daily: 0.01,   // 0.01 ETH per day
      monthly: 0.2,  // 0.2 ETH per month
      yearly: 2      // 2 ETH per year
    };
    
    // Convert ETH to wei (1 ETH = 1e18 wei)
    return Math.floor(pricesInEth[plan] * 1e18).toString();
  }, []);
  
  // Get price in USD
  const getPriceInUsd = useCallback((priceInWei: string) => {
    const priceInEth = parseFloat(priceInWei) / 1e18;
    return (priceInEth * ethToUsd).toFixed(2);
  }, [ethToUsd]);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!address || !window.ethereum) {
      return { isActive: false, endTime: 0, plan: null as SubscriptionPlan };
    }
    
    try {
      const [isActive, endTime] = await Promise.all([
        // isSubscribed
        window.ethereum.request({
          method: 'eth_call',
          params: [
            {
              to: SUBSCRIPTION_CONTRACT,
              data: `0xb0f479ff${address.slice(2).padStart(64, '0')}` // isSubscribed(address)
            },
            'latest'
          ]
        }),
        // endTime
        window.ethereum.request({
          method: 'eth_call',
          params: [
            {
              to: SUBSCRIPTION_CONTRACT,
              data: `0x8f9f4b63${address.slice(2).padStart(64, '0')}` // subscriptions(address)
            },
            'latest'
          ]
        })
      ]);

      const endTimeMs = parseInt(endTime, 16) * 1000; // Convert to milliseconds
      const active = isActive === '0x0000000000000000000000000000000000000000000000000000000000000001' && endTimeMs > Date.now();
      
      // Get plan from endTime response (assuming it's the 4th value)
      const planNum = parseInt(endTime.slice(258, 322), 16);
      const plan = ENUM_TO_PLAN[planNum] || null;
      
      // Update state
      setIsSubscribed(active);
      setSubscriptionEnds(endTimeMs);
      setCurrentPlan(plan);
      
      return {
        isActive: active,
        endTime: endTimeMs,
        plan
      };
    } catch (err) {
      console.error('Error checking subscription:', err);
      return { isActive: false, endTime: 0, plan: null };
    }
  }, [address]);

  // Subscribe to a plan
  const handleSubscribe = async (plan: 'daily' | 'monthly' | 'yearly', paymentMethod: 'usdc' | 'eth' = 'usdc') => {
    if (!address) {
      setError('Wallet not connected');
      toast.error('Please connect your wallet to subscribe');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const planId = PLAN_TO_ENUM[plan];
      const price = getSubscriptionPrice(plan);
      
      if (paymentMethod === 'usdc') {
        // For USDC payment
        if (!approveUSDC) {
          throw new Error('USDC approval not available');
        }
        
        // First approve USDC spending
        toast.info('Approving USDC spending...');
        const approveTx = await approveUSDC({
          args: [SUBSCRIPTION_CONTRACT, BigInt(price)],
        });
        
        // Wait for approval to be mined
        await approveTx.wait();
        
        // Then subscribe
        if (!subscribe) {
          throw new Error('Subscribe function not available');
        }
        
        toast.info('Processing subscription...');
        const tx = await subscribe({
          args: [planId],
        });
        
        await tx.wait();
        toast.success(`Successfully subscribed to ${plan} plan!`);
      } else {
        // For ETH payment
        if (!subscribe) {
          throw new Error('Subscribe function not available');
        }
        
        toast.info('Processing subscription with ETH...');
        const tx = await subscribe({
          args: [planId],
          value: BigInt(price),
        });
        
        await tx.wait();
        toast.success(`Successfully subscribed to ${plan} plan with ETH!`);
      }
      
      // Refresh subscription status
      await checkSubscription();
      
    } catch (err) {
      console.error('Subscription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh subscription status
  const refreshSubscription = useCallback(async () => {
    await checkSubscription();
    await refetch?.();
  }, [checkSubscription, refetch]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      if (address) {
        await getEthPrice();
        await checkSubscription();
      }
    };
    
    init();
  }, [address, checkSubscription, getEthPrice]);

  // Get USDC token address from contract on mount
  useEffect(() => {
    const getUsdcAddress = async () => {
      if (!window.ethereum || !SUBSCRIPTION_CONTRACT || SUBSCRIPTION_CONTRACT === '0x...') return;
      
      try {
        const address = await window.ethereum.request({
          method: 'eth_call',
          params: [
            {
              to: SUBSCRIPTION_CONTRACT,
              data: '0xfc0c546a' // usdcToken()
            },
            'latest'
          ]
        });
        
        if (address && address !== '0x') {
          setUsdcAddress(`0x${address.slice(-40)}`);
        }
      } catch (err) {
        console.error('Error fetching USDC address:', err);
      }
    };
    
    getUsdcAddress();
  }, []);

  const contextValue = {
    isSubscribed,
    subscriptionEnds,
    currentPlan,
    isLoading,
    error,
    subscribe: handleSubscribe,
    checkSubscription,
    subscriptionData: {
      dailyPrice: getPriceInUsd(getSubscriptionPrice('daily')),
      monthlyPrice: getPriceInUsd(getSubscriptionPrice('monthly')),
      yearlyPrice: getPriceInUsd(getSubscriptionPrice('yearly')),
    },
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Export the context for use in the useSubscription hook
export { SubscriptionContext };
