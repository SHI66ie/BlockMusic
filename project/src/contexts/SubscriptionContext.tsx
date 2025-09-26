import { createContext, useCallback, useEffect, useState, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
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

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEnds, setSubscriptionEnds] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usdcAddress, setUsdcAddress] = useState<string>('');

  // Contract reads
  const { refetch: refetchIsSubscribed } = useReadContract({
    address: SUBSCRIPTION_CONTRACT as `0x${string}`,
    abi: SubscriptionManagerABI,
    functionName: 'isSubscribed',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!address,
  });

  const { refetch: fetchSubscriptionEndTime } = useReadContract({
    address: SUBSCRIPTION_CONTRACT as `0x${string}`,
    abi: SubscriptionManagerABI,
    functionName: 'subscriptions',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!address,
    select: (data: unknown): number => {
      if (!data) return 0;
      const subscriptionData = data as [bigint, bigint, boolean, number];
      const endTime = subscriptionData[1];
      return endTime ? Number(endTime) : 0;
    },
  });

  const { refetch: fetchCurrentPlan } = useReadContract({
    address: SUBSCRIPTION_CONTRACT as `0x${string}`,
    abi: SubscriptionManagerABI,
    functionName: 'subscriptions',
    args: address ? [address as `0x${string}`] : undefined,
    enabled: !!address,
    select: (data: unknown): number => {
      if (!data) return 0;
      const subscriptionData = data as [bigint, bigint, boolean, number];
      const plan = subscriptionData[3];
      return plan ? Number(plan) : 0;
    },
  });

  // Contract writes
  const { writeContractAsync: approveUSDC } = useWriteContract();
  const { writeContractAsync: subscribe } = useWriteContract();
  
  // Handle USDC approval
  const handleApproveUSDC = useCallback(async (spender: `0x${string}`, amount: bigint) => {
    if (!usdcAddress) {
      throw new Error('USDC token address not found');
    }
    
    return approveUSDC({
      address: usdcAddress as `0x${string}`,
      abi: MockUSDCABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  }, [approveUSDC, usdcAddress]);
  
  // Define the contract write parameters type with proper typing
  type ContractWriteParams = {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args: unknown[];
    value?: bigint;
  };

  // Handle contract errors consistently
  const handleContractError = useCallback((error: unknown, context: string) => {
    console.error(`${context} error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    setError(errorMessage);
    toast.error(`${context} failed: ${errorMessage}`);
  }, []);

  // Move getSubscriptionPrice before it's used
  const getSubscriptionPrice = useCallback((plan: SubscriptionPlan): string => {
    // Convert the price to a string with 6 decimal places
    const price = (PLAN_PRICES[plan] * 1e6).toFixed(0);
    return price;
  }, []);

  // Move checkSubscription before it's used
  const checkSubscription = useCallback(async (): Promise<SubscriptionStatus> => {
    if (!address) return { isActive: false, endTime: 0, plan: null };
    
    try {
      const [isSubscribedResult, endTimeResult, planResult] = await Promise.all([
        refetchIsSubscribed(),
        fetchSubscriptionEndTime(),
        fetchCurrentPlan(),
      ]);

      const isActive = Boolean(isSubscribedResult.data);
      const endTime = endTimeResult.data || 0;
      const planId = planResult.data || 0;
      const planName = ENUM_TO_PLAN[planId as keyof typeof ENUM_TO_PLAN] || null;
      
      // Update local state
      setIsSubscribed(isActive);
      setSubscriptionEnds(Number(endTime) * 1000);
      setCurrentPlan(planName);
      
      return {
        isActive,
        endTime: Number(endTime) * 1000, // Convert to milliseconds
        plan: planName
      };
    } catch (err) {
      console.error('Error checking subscription:', err);
      return { isActive: false, endTime: 0, plan: null };
    }
  }, [address, refetchIsSubscribed, fetchSubscriptionEndTime, fetchCurrentPlan]);

  // Handle subscription with error handling
  const handleSubscribeWithErrorHandling = useCallback(async (params: Omit<ContractWriteParams, 'value'> & { value?: bigint }) => {
    try {
      if (!subscribe) {
        throw new Error('Subscribe function not available');
      }
      
      return await subscribe({
        ...params,
        // Ensure value is not undefined when not provided
        ...(params.value !== undefined ? { value: params.value } : {})
      });
    } catch (error) {
      handleContractError(error, 'Subscription');
      throw error;
    }
  }, [subscribe, handleContractError]);

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
      const price = BigInt(getSubscriptionPrice(plan));
      
      if (paymentMethod === 'usdc') {
        if (!usdcAddress) {
          throw new Error('USDC token address not found');
        }
        
        // First approve USDC spending
        toast.info('Approving USDC spending...');
        await handleApproveUSDC(SUBSCRIPTION_CONTRACT as `0x${string}`, price);
        
        toast.success('USDC approved! Processing subscription...');
      }
      
      // Then subscribe
      await handleSubscribeWithErrorHandling({
        address: SUBSCRIPTION_CONTRACT as `0x${string}`,
        abi: SubscriptionManagerABI,
        functionName: 'subscribe',
        args: [planId],
        value: paymentMethod === 'eth' ? price : undefined,
      });
      
      toast.success(`Successfully subscribed to ${plan} plan${paymentMethod === 'eth' ? ' with ETH' : ''}!`);
      await checkSubscription();
      
    } catch (error) {
      handleContractError(error, 'Subscription');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    address, 
    usdcAddress, 
    getSubscriptionPrice, 
    handleApproveUSDC, 
    handleSubscribeWithErrorHandling, 
    checkSubscription,
    handleContractError
  ]);


  // Refresh subscription status
  const refreshSubscription = useCallback(async () => {
    try {
      // We can just call checkSubscription which already handles all the refetches
      await checkSubscription();
    } catch (error) {
      handleContractError(error, 'Subscription refresh');
    }
  }, [checkSubscription, handleContractError]);

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
          const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
          const paddedAddress = cleanAddress.padStart(40, '0');
          const formattedAddress = `0x${paddedAddress.slice(0, 40)}`;
          
          // Validate the address format
          if (/^0x[0-9a-fA-F]{40}$/.test(formattedAddress)) {
            // Type assertion to ensure the address is properly typed
          const validAddress = formattedAddress as `0x${string}`;
          setUsdcAddress(validAddress);
          } else {
            console.error('Invalid USDC address format:', formattedAddress);
          }
        }
      } catch (err) {
        console.error('Error fetching USDC address:', err);
        handleContractError(err, 'Fetching USDC address');
      }
    };
    
    getUsdcAddress();
  }, [handleContractError]);

  const subscriptionData = useMemo(() => ({
    // Raw prices for calculations
    monthlyPrice: PLAN_PRICES.monthly.toString(),
    threeMonthsPrice: PLAN_PRICES.threeMonths.toString(),
    yearlyPrice: PLAN_PRICES.yearly.toString(),
    // Formatted prices for display
    formattedMonthlyPrice: PLAN_PRICES.monthly.toFixed(2),
    formattedThreeMonthsPrice: PLAN_PRICES.threeMonths.toFixed(2),
    formattedYearlyPrice: PLAN_PRICES.yearly.toFixed(2),
  }), []);

  const contextValue: SubscriptionContextType = useMemo(() => ({
    isSubscribed,
    subscriptionEnds,
    currentPlan,
    isLoading,
    error,
    subscribe: handleSubscribe,
    checkSubscription,
    refreshSubscription,
    subscriptionData,
  }), [
    isSubscribed,
    subscriptionEnds,
    currentPlan,
    isLoading,
    error,
    handleSubscribe,
    checkSubscription,
    refreshSubscription,
    subscriptionData
  ]);

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

