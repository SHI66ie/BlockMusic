# Production Build Fix - Circular Dependency Issue

## Problem
The application was failing in production with the error:
```
ReferenceError: Cannot access 'B' before initialization
```

This error occurred because of **duplicate provider wrapping** causing a circular dependency during the production build process.

## Root Cause
The application had providers wrapped in two places:

1. **main.tsx** - Wrapped the entire app with:
   - `WagmiProvider`
   - `QueryClientProvider`
   - `RainbowKitProvider`

2. **App.tsx** - Also wrapped itself with the same providers:
   - `WagmiProvider`
   - `QueryClientProvider`
   - `RainbowKitProvider`

This double wrapping created a circular dependency that Vite's production bundler couldn't resolve, leading to the initialization error.

## Solution
Removed the duplicate provider wrapping from `App.tsx`, keeping only the providers in `main.tsx`.

### Changes Made to App.tsx:
- ✅ Removed `WagmiProvider` import and usage
- ✅ Removed `QueryClientProvider` import and usage
- ✅ Removed `RainbowKitProvider` import and usage
- ✅ Removed `config` and `queryClient` imports from `./config/web3`
- ✅ Kept `SubscriptionContextProvider` (application-specific context)
- ✅ Kept routing logic intact

### Provider Hierarchy (After Fix):
```
main.tsx
  └─ WagmiProvider
      └─ QueryClientProvider
          └─ RainbowKitProvider
              └─ App.tsx
                  └─ SubscriptionContextProvider
                      └─ Router
                          └─ Routes
```

## Testing
1. Build completed successfully without errors
2. Production bundle generated correctly
3. No circular dependency warnings

## Deployment
- Commit: `2d7cb78`
- Message: "fix: remove duplicate provider wrapping causing circular dependency in production build"
- Pushed to: `main` branch

## Prevention
To prevent this issue in the future:
1. Always check for duplicate provider wrapping
2. Keep Web3/wallet providers at the root level (main.tsx)
3. Application-specific contexts can be nested inside
4. Test production builds before deploying

## Related Files
- `project/src/main.tsx` - Root provider setup
- `project/src/App.tsx` - Application routing (fixed)
- `project/src/config/web3.ts` - Web3 configuration
