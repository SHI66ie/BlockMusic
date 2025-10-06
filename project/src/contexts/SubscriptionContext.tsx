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
const getEthSubscriptionContract = () => import.meta.env.VITE_ETH_SUBSCRIPTION_CONTRACT || '0x0000000000000000000000000000000000000000';

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
  const ETH_SUBSCRIPTION_CONTRACT = getEthSubscriptionContract();

  const { writeContractAsync } = useWriteContract();

  // Log contract addresses for debugging
  useEffect(() => {
    console.log('USDC Subscription Contract:', SUBSCRIPTION_CONTRACT);
    console.log('ETH Subscription Contract:', ETH_SUBSCRIPTION_CONTRACT);
    console.log('USDC Token:', usdcAddress);
  }, [SUBSCRIPTION_CONTRACT, ETH_SUBSCRIPTION_CONTRACT, usdcAddress]);

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

  const handleSubscribe = useCallback(async (planId: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    // Get the plan enum value (0, 1, or 2)
    const planEnum = PLAN_TO_ENUM[planId as SubscriptionPlan];
    
    // Get the price for this plan in USD
    const planPriceUSD = PLAN_PRICES[planId as SubscriptionPlan];
    
    // Convert USD price to USDC amount (USDC has 6 decimals)
    // $2.5 = 2,500,000 (2.5 * 10^6)
    const usdcAmount = BigInt(Math.floor(planPriceUSD * 1e6));

    setIsLoading(true);
    setError(null);

    try {
      console.log('Initiating USDC subscription transaction:', {
        contract: SUBSCRIPTION_CONTRACT,
        usdcToken: usdcAddress,
        planId: planId,
        planEnum: planEnum,
        planPriceUSD: `$${planPriceUSD}`,
        usdcAmount: usdcAmount.toString(),
        usdcAmountFormatted: `${planPriceUSD} USDC`,
        userAddress: address,
      });

      // Step 1: Approve USDC spending
      toast.info(`Step 1/2: Approving $${planPriceUSD} USDC...`);
      
      const approvalTx = await writeContractAsync({
        address: usdcAddress as `0x${string}`,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'approve',
        args: [SUBSCRIPTION_CONTRACT, usdcAmount],
      });

      console.log('USDC Approval confirmed:', approvalTx);
      
      // Step 2: Subscribe
      toast.info('Step 2/2: Processing subscription...');
      
      const tx = await writeContractAsync({
        address: SUBSCRIPTION_CONTRACT as `0x${string}`,
        abi: SubscriptionManagerABI,
        functionName: 'subscribe',
        args: [planEnum],
      });

      console.log('Subscription transaction confirmed:', tx);
      toast.success(`Successfully subscribed for $${planPriceUSD}!`);

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
  }, [address, checkSubscription, writeContractAsync, SUBSCRIPTION_CONTRACT, usdcAddress]);

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

