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

  // Get subscription status
  const { refetch } = useContractRead({
    address: SUBSCRIPTION_CONTRACT as `0x${string}`,
    abi: SubscriptionManagerABI,
    functionName: 'isSubscribed',
    args: [address],
    enabled: !!address,
  });

  // USDC approval
  const { writeContractAsync: approveUSDC } = useContractWrite();
  
  // Subscribe function
  const { writeContractAsync: subscribe } = useContractWrite();

  // Get subscription end time
  const { refetch: fetchSubscriptionEndTime } = useContractRead({
    address: SUBSCRIPTION_CONTRACT as `0x${string}`,
    abi: SubscriptionManagerABI,
    functionName: 'subscriptions',
    args: [address],
    enabled: !!address,
    select: (data: unknown) => {
      const subscriptionData = data as [bigint, bigint, boolean, number] | undefined;
      return subscriptionData?.[1] ? Number(subscriptionData[1]) : 0; // Convert bigint to number
    },
  });

  // Get current plan
  const { refetch: fetchCurrentPlan } = useContractRead({
    address: SUBSCRIPTION_CONTRACT as `0x${string}`,
    abi: SubscriptionManagerABI,
    functionName: 'subscriptions',
    args: [address],
    enabled: !!address,
    select: (data: unknown) => {
      const subscriptionData = data as [bigint, bigint, boolean, number] | undefined;
      return subscriptionData?.[3] || 0; // plan is the fourth element in the struct
    },
  });

  // Get subscription price in USDC (6 decimals)
  const getSubscriptionPrice = useCallback((plan: SubscriptionPlan): string => {
    // Convert the price to a string with 6 decimal places
    const price = (PLAN_PRICES[plan] * 1e6).toFixed(0);
    return price;
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
        if (!usdcAddress) {
          throw new Error('USDC token address not found');
        }
        
        toast.info('Approving USDC spending...');
        await approveUSDC({
          address: usdcAddress as `0x${string}`,
          abi: MockUSDCABI,
          functionName: 'approve',
          args: [SUBSCRIPTION_CONTRACT, BigInt(price)],
        });
        
        toast.info('Processing subscription...');
        await subscribe({
          address: SUBSCRIPTION_CONTRACT as `0x${string}`,
          abi: SubscriptionManagerABI,
          functionName: 'subscribe',
          args: [planId],
        });
        
        toast.success(`Successfully subscribed to ${plan} plan!`);
      } else {
        toast.info('Processing subscription with ETH...');
        await subscribe({
          address: SUBSCRIPTION_CONTRACT as `0x${string}`,
          abi: SubscriptionManagerABI,
          functionName: 'subscribe',
          args: [planId],
          value: BigInt(price),
        });
        
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
  }, [address, usdcAddress, approveUSDC, checkSubscription, getSubscriptionPrice, subscribe]);

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
              to: SUBSCRIPTION_CONTRACT as `0x${string}`,
              data: '0xfc0c546a' // usdcToken()
            },
            'latest'
          ]
        });
        
        if (address && address !== '0x') {
          // Ensure the address is properly formatted
          const formattedAddress = address.startsWith('0x') ? address : `0x${address}`;
          setUsdcAddress(formattedAddress.slice(0, 42)); // Ensure 20-byte address with 0x prefix
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
      // Raw prices for calculations
      monthlyPrice: (PLAN_PRICES.monthly).toString(),
      threeMonthsPrice: (PLAN_PRICES.threeMonths).toString(),
      yearlyPrice: (PLAN_PRICES.yearly).toString(),
      // Formatted prices for display
      formattedMonthlyPrice: PLAN_PRICES.monthly.toFixed(2),
      formattedThreeMonthsPrice: PLAN_PRICES.threeMonths.toFixed(2),
      formattedYearlyPrice: PLAN_PRICES.yearly.toFixed(2),
    },
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export { SubscriptionContext };

