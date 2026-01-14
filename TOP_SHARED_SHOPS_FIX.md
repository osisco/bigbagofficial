# Top Shared Shops Country Consistency Fix

## Problem
The top shared shops feature had country inconsistency issues:
- Frontend account shows US (United States)
- Backend was showing AF (Afghanistan) shops
- Country data was inconsistent between sharing and querying

## Root Causes

1. **Country Format Mismatch:**
   - User accounts store country as **name** (e.g., "United States")
   - `useCountry` hook stores country as **code** (e.g., "US") in localStorage
   - Sharing used country **code** → Backend stored as "US"
   - Querying used country **name** → Backend queried "UNITED STATES"
   - Database had "US" but query looked for "UNITED STATES" → No match!

2. **Inconsistent Country Sources:**
   - Sharing used `selectedCountry` from localStorage (code)
   - Querying converted code to name
   - User's account country was not being used consistently

## Solutions Implemented

### 1. Created Country Normalization Utility
**File:** `api/utils/countryUtils.js`
- Handles conversion between country codes and names
- Normalizes all country inputs to consistent format
- Supports both "US" and "United States" formats

### 2. Backend: Always Use User's Account Country
**File:** `api/controllers/shop.js`
- `getTopSharedShopsOfWeek`: **ALWAYS** uses authenticated user's account country when available
- Ignores query parameter if user is authenticated
- Normalizes country to code format for consistent database queries
- `shareShop`: Normalizes country to code format before storing

### 3. Frontend: Use User's Account Country
**Files:** 
- `client/app/(tabs)/shops.tsx`
- `client/components/ShopCard.tsx`
- `client/app/shop/[id].tsx`

**Changes:**
- Priority 1: Use `user.country` from account (if authenticated)
- Priority 2: Fall back to `selectedCountry` from localStorage (for guests)
- Convert country name to code when sharing
- Send country name when querying (backend will use user's country anyway if authenticated)

### 4. Optional Authentication Middleware
**File:** `api/routes/shop.js`
- Added `optionalAuth` middleware for `/top-shared` route
- Allows route to work with or without authentication
- Sets `req.user` if valid token is present
- Doesn't fail if no token (for guest access)

## How It Works Now

### For Authenticated Users:
1. **Sharing a Shop:**
   - Uses `user.country` (name) → Converts to code → Backend stores as "US"
   
2. **Viewing Top Shared Shops:**
   - Backend automatically uses `user.country` from account
   - Converts to code format → Queries database with "US"
   - Returns shops shared in "US" (matches what was stored)

### For Guest Users:
1. **Sharing a Shop:**
   - Uses `selectedCountry` (code) → Backend stores as "US"
   
2. **Viewing Top Shared Shops:**
   - Uses `selectedCountry` (code) → Converts to name → Sends to backend
   - Backend normalizes to code → Queries with "US"

## Key Functions

### `normalizeCountryToCode(country)`
- Converts "United States" → "US"
- Converts "US" → "US"
- Handles both formats consistently

### `getTopSharedShopsOfWeek`
- **Priority 1:** Use authenticated user's account country (if available)
- **Priority 2:** Use query parameter (for guests)
- Normalizes to code format before querying

## Testing Checklist

- [ ] Authenticated user with account country "United States" sees US shops
- [ ] Authenticated user's shares are recorded with correct country
- [ ] Guest user can view top shared shops for their selected country
- [ ] Country conversion works for both codes and names
- [ ] Backend logs show correct country being used

## Files Modified

1. `api/utils/countryUtils.js` - **NEW** - Country normalization utility
2. `api/controllers/shop.js` - Updated shareShop and getTopSharedShopsOfWeek
3. `api/routes/shop.js` - Added optionalAuth middleware
4. `client/app/(tabs)/shops.tsx` - Use user's account country
5. `client/components/ShopCard.tsx` - Use user's account country when sharing
6. `client/app/shop/[id].tsx` - Use user's account country when sharing

## Result

✅ **Consistent country usage throughout the app**
✅ **Authenticated users always see shops for their account country**
✅ **Sharing and querying use the same country source**
✅ **No more mismatches between frontend and backend**
