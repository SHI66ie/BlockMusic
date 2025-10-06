# Production Build Fix - Circular Dependency Issue

## Problem
The application was failing in production with the error:
```
ReferenceError: Cannot access 'B' before initialization
```

This error occurred because of **multiple circular dependencies** causing initialization issues during the production build process.

## Root Causes

### 1. Duplicate Provider Wrapping (Fixed in commit 2d7cb78)
The application had providers wrapped in two places:

1. **main.tsx** - Wrapped the entire app with:
   - `WagmiProvider`
   - `QueryClientProvider`
   - `RainbowKitProvider`

2. **App.tsx** - Also wrapped itself with the same providers:
   - `WagmiProvider`
   - `QueryClientProvider`
   - `RainbowKitProvider`

This double wrapping created a circular dependency that Vite's production bundler couldn't resolve.

### 2. Circular Hook Dependencies (Fixed in commit 971c25a)
The subscription hooks had a circular dependency chain:

1. **SubscriptionContextProvider.tsx** → imported `useSubscription` from `hooks/useSubscription.ts`
2. **hooks/useSubscription.ts** → imported from `SubscriptionContext`
3. **hooks/useSubscriptionHook.ts** → re-exported from `contexts/useSubscription.ts`
4. **contexts/useSubscription.ts** → also exported `useSubscription`

This created a circular initialization loop where the provider tried to use the hook before the context was fully initialized.

### 3. Function Name Collision (Fixed in commit a92d570)

The `SubscriptionContext.tsx` file had two functions with the same name:

1. **Line 15:** `const getUsdcAddress = () => import.meta.env.VITE_USDC_TOKEN` (getter for env variable)
2. **Line 157:** `const getUsdcAddress = useCallback(async () => ...)` (validation function)

This naming collision caused a hoisting error where variable 'B' (minified `getUsdcAddress`) was accessed before initialization in the production bundle.

## Solutions

### Fix 1: Remove Duplicate Provider Wrapping

Removed the duplicate provider wrapping from `App.tsx`, keeping only the providers in `main.tsx`.

**Changes Made to App.tsx:**
- ✅ Removed `WagmiProvider` import and usage
- ✅ Removed `QueryClientProvider` import and usage
- ✅ Removed `RainbowKitProvider` import and usage
- ✅ Removed `config` and `queryClient` imports from `./config/web3`
- ✅ Kept `SubscriptionContextProvider` (application-specific context)
- ✅ Kept routing logic intact

**Provider Hierarchy (After Fix):**

```text
main.tsx
  └─ WagmiProvider
      └─ QueryClientProvider
          └─ RainbowKitProvider
              └─ App.tsx
                  └─ SubscriptionContextProvider
                      └─ Router
                          └─ Routes
```

### Fix 2: Consolidate Subscription Hooks

Eliminated the circular dependency by consolidating duplicate hook files into a single source of truth.

**Changes Made:**

- ✅ Deleted `hooks/useSubscriptionHook.ts` (duplicate file)
- ✅ Simplified `contexts/SubscriptionContextProvider.tsx` - removed `SubscriptionInitializer` component that was causing circular import
- ✅ Created single `hooks/useSubscription.ts` as the canonical hook
- ✅ Updated `contexts/useSubscription.ts` to re-export from hooks (backward compatibility)
- ✅ Updated all component imports to use `hooks/useSubscription`

**Files Updated:**

- `components/subscription/SubscriptionGuard.tsx`
- `components/subscription/SubscriptionPlan.tsx`
- `components/subscription/SubscriptionPlans.tsx`
- `components/subscription/SubscriptionStatus.tsx`
- `pages/Subscribe.tsx`

### Fix 3: Resolve Function Name Collision

Renamed the environment variable getter function to avoid collision with the validation function.

**Changes Made:**

- ✅ Renamed `getUsdcAddress` (line 15) to `getUsdcTokenAddress`
- ✅ Updated reference on line 29 to use `getUsdcTokenAddress()`
- ✅ Removed unused `handleContractError` function
- ✅ Removed redundant `getUsdcAddress` validation function and its useEffect

## Testing

1. Build completed successfully without errors
2. Production bundle generated correctly
3. No circular dependency warnings
4. No function hoisting errors

## Deployment

**Commit 1:** `2d7cb78`

- Message: "fix: remove duplicate provider wrapping causing circular dependency in production build"
- Pushed to: `main` branch

**Commit 2:** `971c25a`

- Message: "fix: resolve circular dependency in subscription hooks causing production build error"
- Pushed to: `main` branch

**Commit 3:** `a92d570`

- Message: "fix: resolve function name collision in SubscriptionContext causing hoisting error"
- Pushed to: `main` branch

## Prevention

To prevent this issue in the future:

1. Always check for duplicate provider wrapping
2. Keep Web3/wallet providers at the root level (main.tsx)
3. Application-specific contexts can be nested inside
4. Avoid circular imports between hooks and contexts
5. Use a single source of truth for custom hooks
6. **Avoid function name collisions** - use unique names for all functions in the same scope
7. Test production builds before deploying

## Related Files

- `project/src/main.tsx` - Root provider setup
- `project/src/App.tsx` - Application routing (fixed)
- `project/src/config/web3.ts` - Web3 configuration
- `project/src/hooks/useSubscription.ts` - Consolidated subscription hook
- `project/src/contexts/SubscriptionContext.tsx` - Subscription context provider
- `project/src/contexts/SubscriptionContextProvider.tsx` - Simplified provider wrapper
