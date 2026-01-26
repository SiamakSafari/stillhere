# Changelog

## [1.1.0] - 2026-01-26

### 🔴 Critical Fixes
- **Fixed missing `await` in activities.js** - `getUser()` was not awaited, causing undefined user errors
- **Activities now persist to database** - Replaced in-memory `Map()` storage with SQLite table. Server restarts no longer lose active activity timers

### 🔒 Security Improvements
- **Added authentication middleware** - Bearer token auth for all user-specific routes
  - Auth tokens generated on user creation and stored in DB
  - Enable with `AUTH_ENABLED=true` in .env (disabled by default for backward compatibility)
  - Client automatically stores/sends auth token
- **Added input validation middleware** - All inputs now validated:
  - UUID format validation
  - Email format validation  
  - String length limits
  - Coordinate range validation
  - Timezone validation
- **Added HTML escaping** - Prevents XSS in confirmation pages and email templates
- **Enhanced rate limiting** - Now limits by token AND IP address

### 🐛 Bug Fixes
- **Fixed timezone-aware streak calculation** - Server now uses user's timezone for `isYesterday()` check, matching client behavior
- **Removed duplicate endpoint** - `/api/test-alert` removed; use `/api/users/:id/test-alert` instead
- **Fixed rate limit cleanup** - Now properly cleans up old entries using timestamps

### 🏗️ Code Quality
- **Extracted configuration** - Magic numbers moved to `server/config.js`
- **Standardized error responses** - All routes use consistent error format with `code` field
- **Added response utilities** - `server/utils/response.js` for consistent API responses
- **Improved request logging** - Now includes response time

### 📦 New Files
- `server/config.js` - Centralized configuration
- `server/middleware/auth.js` - Authentication middleware
- `server/middleware/validate.js` - Input validation middleware  
- `server/utils/response.js` - Standardized response helpers

### 🗃️ Database Changes
- Added `auth_token` column to users table
- Added `activities` table for persistent activity storage
- Added indexes for auth_token and activities

### ⚙️ Configuration
New environment variables:
- `AUTH_ENABLED` - Enable/disable authentication (default: false)
- `APP_URL` - Base URL for confirmation links (default: http://localhost:5173)

### 🔄 Scheduler Improvements
- Activity alerts now checked every minute (was only on timeout)
- Added weekly data pruning job (Sundays at 3am)
- Better tracking cleanup using timestamps instead of date strings

### 📝 Client Updates
- API client now stores and sends auth token automatically
- Auth token cleared on app reset
- Updated test-alert endpoint path

---

## Migration Notes

### From 1.0.0 to 1.1.0

1. **Database Migration** - Run the server once; migrations auto-apply
2. **Auth Token** - Existing users will get tokens on next server interaction
3. **Enable Auth** (optional) - Set `AUTH_ENABLED=true` in production after users have tokens
4. **Test Alert Endpoint** - Update any direct API calls from `/api/test-alert` to `/api/users/:id/test-alert`

### Breaking Changes
- `/api/test-alert` endpoint removed (use `/api/users/:id/test-alert`)
- When `AUTH_ENABLED=true`, all user routes require Bearer token
