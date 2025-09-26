import { createContext, useCallback, useEffect, useState, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { toast } from 'react-toastify';

// Import ABI and constants
import { SubscriptionManager as SubscriptionManagerABI } from '../abis/SubscriptionManager';
import { MockUSDC as MockUSDCABI } from '../abis/MockUSDC';
import { 
  PLAN_TO_ENUM,
  ENUM_TO_PLAN,
  PLAN_PRICES,
  SubscriptionPlan
} from '../constants/subscription';
import { SubscriptionContextType, SubscriptionStatus } from '../types/subscription';

// Get contract addresses from environment variables
const SUBSCRIPTION_CONTRACT = import.meta.env.VITE_SUBSCRIPTION_CONTRACT || '0x...';
const USDC_TOKEN = import.meta.env.VITE_USDC_TOKEN || '0x...';

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEnds, setSubscriptionEnds] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usdcAddress = USDC_TOKEN;

  // Log contract addresses for debugging
  useEffect(() => {
    console.log('Subscription Contract:', SUBSCRIPTION_CONTRACT);
    console.log('USDC Token:', usdcAddress);
  }, [usdcAddress]);

  // Contract reads
  const { refetch: refetchIsSubscribed } = useReadContract({
    address: SUBSCRIPTION_CONTRACT as `0x${string}`,
    abi: SubscriptionManagerABI,
{{ ... }}
    };
    
    init();
  }, [address, checkSubscription, usdcAddress]);

  const getUsdcAddress = useCallback(async () => {
    try {
      const formattedAddress = usdcAddress.replace(/0x/g, '').toLowerCase();
      if (formattedAddress.length === 40) {
        setUsdcAddress(formattedAddress);
      } else {
        console.error('Invalid USDC address format:', formattedAddress);
      }
    } catch (err) {
      console.error('Error fetching USDC address:', err);
      handleContractError(err, 'Fetching USDC address');
    }
  }, [handleContractError, usdcAddress]);
  
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

