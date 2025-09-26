// Contract addresses - should be in .env file in production
export const SUBSCRIPTION_CONTRACT = process.env.REACT_APP_SUBSCRIPTION_CONTRACT || '0x...';

// Plan mappings
export const PLAN_TO_ENUM = {
  monthly: 0,
  threeMonths: 1,
  yearly: 2
} as const;

export type SubscriptionPlan = 'monthly' | 'threeMonths' | 'yearly';

export const ENUM_TO_PLAN: Record<number, SubscriptionPlan | null> = {
  0: 'monthly',
  1: 'threeMonths',
  2: 'yearly'
};

// Subscription prices in USDC (6 decimals)
export const PLAN_PRICES = {
  monthly: 2.5,      // 2.5 USDC
  threeMonths: 6.75, // 6.75 USDC (10% discount from 7.5 USDC)
  yearly: 25         // 25 USDC (15% discount from 30 USDC)
} as const;
