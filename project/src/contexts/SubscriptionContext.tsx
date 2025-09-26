import { createContext, useCallback, useEffect, useState } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { toast } from 'react-toastify';

// Import ABI and constants
import { SubscriptionManager as SubscriptionManagerABI } from '../abis/SubscriptionManager';
import { MockUSDC as MockUSDCABI } from '../abis/MockUSDC';
import { 
  SUBSCRIPTION_CONTRACT,
  PLAN_TO_ENUM,
  ENUM_TO_PLAN,
  PLAN_PRICES,
  SubscriptionPlan
} from '../constants/subscription';
import { SubscriptionContextType, SubscriptionStatus } from '../types/subscription';

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEnds, setSubscriptionEnds] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
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

  // Get subscription end time
  const { refetch: fetchSubscriptionEndTime } = useContractRead({
    ...subscriptionContract,
    functionName: 'subscriptions',
    args: [address],
    enabled: !!address,
    select: (data: unknown) => {
      const subscriptionData = data as [string, number, boolean, number] | undefined;
      return subscriptionData?.[1] || 0; // endTime is the second element in the struct
    },
  });

  // Get current plan
  const { refetch: fetchCurrentPlan } = useContractRead({
    ...subscriptionContract,
    functionName: 'subscriptions',
    args: [address],
    enabled: !!address,
    select: (data: unknown) => {
      const subscriptionData = data as [string, number, boolean, number] | undefined;
      return subscriptionData?.[3] || 0; // plan is the fourth element in the struct
    },
  });

  // Get subscription price in USDC (6 decimals)
  const getSubscriptionPrice = useCallback((plan: SubscriptionPlan): string => {
    return Math.floor(PLAN_PRICES[plan] * 1e6).toString();
  }, []);
  

  // Check subscription status
  const checkSubscription = useCallback(async (): Promise<SubscriptionStatus> => {
    if (!address) return { isActive: false, endTime: 0, plan: null };
    
    try {
      const result = await refetch();
      const isActive = result.data as boolean;
      
      const endTimeResult = await fetchSubscriptionEndTime();
      const endTime = endTimeResult.data as number;
      
      const planResult = await fetchCurrentPlan();
      const plan = planResult.data as number;
      
      const planName = ENUM_TO_PLAN[plan] || null;
      
      // Update local state
      setIsSubscribed(isActive);
      setSubscriptionEnds(endTime * 1000);
      setCurrentPlan(planName);
      
      return {
        isActive,
        endTime: endTime * 1000, // Convert to milliseconds
        plan: planName
      };
    } catch (err) {
      console.error('Error checking subscription:', err);
      return { isActive: false, endTime: 0, plan: null };
    }
  }, [address, refetch, fetchSubscriptionEndTime, fetchCurrentPlan]);

  // Handle subscription
  const handleSubscribe = useCallback(async (plan: SubscriptionPlan, paymentMethod: 'usdc' | 'eth' = 'usdc') => {
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
        if (!approveUSDC) {
          throw new Error('USDC approval not available');
        }
        
        toast.info('Approving USDC spending...');
        const approveTx = await approveUSDC({
          args: [SUBSCRIPTION_CONTRACT, BigInt(price)],
        });
        
        await approveTx.wait();
        
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
      
      await checkSubscription();
      
    } catch (err) {
      console.error('Subscription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address, approveUSDC, checkSubscription, getSubscriptionPrice, subscribe]);

  // Refresh subscription status
  const refreshSubscription = useCallback(async () => {
    await checkSubscription();
    await refetch?.();
  }, [checkSubscription, refetch]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      if (address) {
        await checkSubscription();
      }
    };
    
    init();
  }, [address, checkSubscription]);

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

  const contextValue: SubscriptionContextType = {
    isSubscribed,
    subscriptionEnds,
    currentPlan,
    isLoading,
    error,
    subscribe: handleSubscribe,
    checkSubscription,
    refreshSubscription,
    subscriptionData: {
      monthlyPrice: PLAN_PRICES.monthly.toFixed(2),
      threeMonthsPrice: PLAN_PRICES.threeMonths.toFixed(2),
      yearlyPrice: PLAN_PRICES.yearly.toFixed(2),
    },
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export { SubscriptionContext };

