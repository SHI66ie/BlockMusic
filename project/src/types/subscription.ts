import { SubscriptionPlan } from '../constants/subscription';

export interface SubscriptionStatus {
  isActive: boolean;
  endTime: number;
  plan: SubscriptionPlan | null;
}

export interface SubscriptionData {
  // Raw prices for calculations (in wei or smallest unit)
  monthlyPrice: string;
  threeMonthsPrice: string;
  yearlyPrice: string;
  // Formatted prices for display (with 2 decimal places)
  formattedMonthlyPrice: string;
  formattedThreeMonthsPrice: string;
  formattedYearlyPrice: string;
}

export interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionEnds: number | null;
  currentPlan: SubscriptionPlan | null;
  isLoading: boolean;
  error: string | null;
  subscribe: (plan: SubscriptionPlan, paymentMethod?: 'usdc' | 'eth') => Promise<void>;
  checkSubscription: () => Promise<SubscriptionStatus>;
  refreshSubscription: () => Promise<void>;
  subscriptionData: SubscriptionData;
}
