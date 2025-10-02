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

// Get contract addresses from environment variables
const SUBSCRIPTION_CONTRACT = import.meta.env.VITE_SUBSCRIPTION_CONTRACT || '0x...';
const USDC_TOKEN = import.meta.env.VITE_USDC_TOKEN || '0x...';

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEnds] = useState<number | null>(null); // Keep for future use
  const [currentPlan] = useState<SubscriptionPlan | null>(null); // Keep for future use
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usdcAddress = USDC_TOKEN;

  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  // Log contract addresses for debugging
  useEffect(() => {
    console.log('Subscription Contract:', SUBSCRIPTION_CONTRACT);
    console.log('USDC Token:', usdcAddress);
  }, [usdcAddress]);

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
    if (!address) return;
    
    try {
      const result = await refetchIsSubscribed();
      setIsSubscribed(!!result.data);
      setError(null); // Clear error on success
      // You might want to fetch additional subscription details here
    } catch (error) {
      console.error('Error checking subscription:', error);
      setError('Failed to check subscription status');
    }
  }, [address, refetchIsSubscribed]);

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

      await checkSubscription();
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Failed to process subscription');
      toast.error('Subscription failed');
    } finally {
      setIsLoading(false);
    }
  }, [address, checkSubscription, writeContractAsync, sendTransactionAsync]);

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

  const handleContractError = useCallback((error: Error, context: string) => {
    console.error(`Error in ${context}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    setError(`Error: ${errorMessage}`);
    toast.error(`Error: ${errorMessage}`);
  }, []);

  const getUsdcAddress = useCallback(async () => {
    try {
      const formattedAddress = usdcAddress.replace(/0x/g, '').toLowerCase();
      if (formattedAddress.length === 40) {
        // If you need to update usdcAddress, you'll need to use a state setter
        console.log('USDC Address formatted:', `0x${formattedAddress}`);
        setError(null); // Clear error on success
      } else {
        console.error('Invalid USDC address format:', formattedAddress);
        setError('Invalid USDC address format');
      }
    } catch (err) {
      console.error('Error processing USDC address:', err);
      handleContractError(err, 'Processing USDC address');
    }
  }, [usdcAddress, handleContractError]);
  
  useEffect(() => {
    getUsdcAddress();
  }, [getUsdcAddress]);

  const subscriptionData = useMemo(() => ({
    // Raw prices for calculations
    monthlyPrice: PLAN_PRICES.monthly.toString(),
    threeMonthsPrice: PLAN_PRICES.threeMonths.toString(),
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

