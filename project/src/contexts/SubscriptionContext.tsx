import { createContext, useCallback, useEffect, useState, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useSendTransaction } from 'wagmi';
import { toast } from 'react-toastify';

// Import ABI and constants
import { SubscriptionManager as SubscriptionManagerABI } from '../abis/SubscriptionManager';
import { 
  PLAN_PRICES,
  SubscriptionPlan
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
  const { sendTransactionAsync } = useSendTransaction();

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
    const planIdNumber = parseInt(planId, 10);
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (paymentMethod === 'usdc') {
        // USDC Payment
        console.log('Initiating USDC subscription transaction:', {
          contract: SUBSCRIPTION_CONTRACT,
          planId: planIdNumber,
          userAddress: address,
        });

        const tx = await writeContractAsync({
          address: SUBSCRIPTION_CONTRACT as `0x${string}`,
          abi: SubscriptionManagerABI,
          functionName: 'subscribe',
          args: [planIdNumber],
        });

        console.log('USDC Transaction sent:', tx);
        toast.success('USDC Subscription transaction sent! Confirm in your wallet.');
      } else {
        // ETH Payment (for Base testnet)
        const planPrices = {
          monthly: PLAN_PRICES.monthly,
          threeMonths: PLAN_PRICES.threeMonths,
          yearly: PLAN_PRICES.yearly,
        };

        const usdAmount = planPrices[planId as keyof typeof planPrices] || 0;
        const usdcAmount = BigInt(Math.floor(usdAmount * 1e6)); // Convert USD to USDC smallest unit (6 decimals)
        const ethPrice = BigInt(2000 * 1e8); // ETH price in USD with 8 decimals (e.g., $2000 = 2000e8)
        const ethAmount = (usdcAmount * BigInt(1e18)) / ethPrice; // Calculate ETH amount in wei

        console.log('Initiating ETH subscription transaction:', {
          contract: SUBSCRIPTION_CONTRACT,
          planId: planIdNumber,
          usdAmount,
          usdcAmount: usdcAmount.toString(),
          ethAmount: ethAmount.toString(),
          userAddress: address,
        });

        const tx = await sendTransactionAsync({
          to: SUBSCRIPTION_CONTRACT as `0x${string}`,
          value: ethAmount,
          data: '0x', // No additional data for direct ETH send
        });

        console.log('ETH Transaction sent:', tx);
        toast.success('ETH Subscription transaction sent! Confirm in your wallet.');
      }

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
  }, [address, checkSubscription, writeContractAsync, sendTransactionAsync, SUBSCRIPTION_CONTRACT]);

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

