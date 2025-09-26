import { SubscriptionPlan } from '../constants/subscription';

export interface SubscriptionStatus {
  isActive: boolean;
  endTime: number;
  plan: SubscriptionPlan | null;
}

export interface SubscriptionData {
  monthlyPrice: string;
  threeMonthsPrice: string;
  yearlyPrice: string;
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
