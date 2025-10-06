import { createContext, useCallback, useEffect, useState, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { toast } from 'react-toastify';

// Import ABI and constants
import { SubscriptionManager as SubscriptionManagerABI } from '../abis/SubscriptionManager';
import { 
  PLAN_PRICES,
  SubscriptionPlan,
  PLAN_TO_ENUM
} from '../constants/subscription';
import { SubscriptionContextType } from '../types/subscription';

// Get contract addresses from environment variables (inside component to ensure loading)
const getContractAddress = () => import.meta.env.VITE_SUBSCRIPTION_CONTRACT || '0x49eC6Fff8d915DC8F1FF382941D0c5DADF9F013B';
const getUsdcTokenAddress = () => import.meta.env.VITE_USDC_TOKEN || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEnds] = useState<number | null>(null); // Keep for future use
  const [currentPlan] = useState<SubscriptionPlan | null>(null); // Keep for future use
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get addresses inside component to ensure they're loaded
  const SUBSCRIPTION_CONTRACT = getContractAddress();
  const usdcAddress = getUsdcTokenAddress();

  const { writeContractAsync } = useWriteContract();

  // Log contract addresses for debugging
  useEffect(() => {
    console.log('Subscription Contract:', SUBSCRIPTION_CONTRACT);
    console.log('USDC Token:', usdcAddress);
  }, [SUBSCRIPTION_CONTRACT, usdcAddress]);

  // Contract reads
  const { refetch: refetchIsSubscribed } = useReadContract({
    address: SUBSCRIPTION_CONTRACT as `0x${string}`,
    abi: SubscriptionManagerABI as readonly unknown[], // Better type assertion
    functionName: 'isSubscribed',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const checkSubscription = useCallback(async () => {
    if (!address) {
      return { isActive: false, endTime: 0, plan: null };
    }
    
    try {
      const result = await refetchIsSubscribed();
      const isActive = !!result.data;
      setIsSubscribed(isActive);
      setError(null); // Clear error on success
      
      // Return subscription status
      return {
        isActive,
        endTime: subscriptionEnds || 0,
        plan: currentPlan,
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      setError('Failed to check subscription status');
      return { isActive: false, endTime: 0, plan: null };
    }
  }, [address, refetchIsSubscribed, subscriptionEnds, currentPlan]);

  const handleSubscribe = useCallback(async (planId: string, paymentMethod: 'usdc' | 'eth' = 'eth') => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    // Get the plan enum value (0, 1, or 2)
    const planEnum = PLAN_TO_ENUM[planId as SubscriptionPlan];
    
    // Get the price for this plan
    const planPrice = PLAN_PRICES[planId as SubscriptionPlan];
    
    // Convert price to wei (assuming price is in USDC, convert to ETH equivalent)
    // For testnet: 1 USDC ≈ 0.0005 ETH (assuming ETH = $2000)
    const priceInEth = planPrice / 2000; // Convert USDC to ETH
    const valueInWei = BigInt(Math.floor(priceInEth * 1e18)); // Convert to wei

    setIsLoading(true);
    setError(null);

    try {
      console.log('Initiating subscription transaction:', {
        contract: SUBSCRIPTION_CONTRACT,
        planId: planId,
        planEnum: planEnum,
        planPrice: planPrice,
        priceInEth: priceInEth,
        valueInWei: valueInWei.toString(),
        userAddress: address,
        paymentMethod: paymentMethod,
      });

      // Call the subscribe function on the contract with ETH payment
      const tx = await writeContractAsync({
        address: SUBSCRIPTION_CONTRACT as `0x${string}`,
        abi: SubscriptionManagerABI,
        functionName: 'subscribe',
        args: [planEnum],
        value: valueInWei, // Send ETH with the transaction
      });

      console.log('Transaction sent:', tx);
      toast.success('Subscription transaction sent! Waiting for confirmation...');

      // Check subscription status after transaction
      const subscriptionStatus = await checkSubscription();
      
      // If subscription is successful, grant explorer access
      if (subscriptionStatus && subscriptionStatus.isActive) {
        toast.success('🎉 Subscription successful! You now have Explorer Access to the marketplace!', {
          autoClose: 5000,
        });
        console.log('Explorer access granted for user:', address);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Failed to process subscription');
      toast.error('Subscription failed');
    } finally {
      setIsLoading(false);
    }
  }, [address, checkSubscription, writeContractAsync, SUBSCRIPTION_CONTRACT]);

  const refreshSubscription = useCallback(async () => {
    await checkSubscription();
  }, [checkSubscription]);

  // Initialize subscription check when address changes
  useEffect(() => {
    const init = async () => {
      if (address) {
        await checkSubscription();
      }
    };
    
    init();
  }, [address, checkSubscription]);

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

