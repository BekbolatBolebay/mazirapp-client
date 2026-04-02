# MVP Migration Guide

This document outlines the changes made to transition the Cafe SaaS Admin project from demo mode to MVP architecture.

## Summary of Changes

### ✅ Completed

1. **Environment Variables Management**
   - Created `.env.local` for local development
   - Created `.env.example` as a template
   - Centralized config in `src/lib/config.ts`
   - Removed hardcoded values from code

2. **Architecture Refactoring**
   - Separated concerns: UI components → API services
   - Created service layer for API calls
   - Implemented proper error handling
   - Added demo mode fallback for offline development

3. **Frontend Services**
   - **`src/services/api.ts`** - Base HTTP client for making requests
   - **`src/services/cafesService.ts`** - Cafe management operations
   - **`src/services/subscriptionsService.ts`** - Subscription management

4. **Hooks Refactoring**
   - **`useSubscriptions`** - Now fetches from API instead of localStorage
   - Returns loading and error states for better UX

5. **Components Updated**
   - **CafesPage** - Fetches cafes from API, uses service methods for actions
   - **SubscriptionsPage** - Uses async handlers for API calls
   - Async error handling in all components

6. **Backend API Server**
   - Created `server/api.ts` with Express.js
   - Implemented RESTful endpoints for:
     - Cafe operations (CRUD, block/unblock, notify)
     - Subscription operations (CRUD)
   - Health check endpoint
   - CORS enabled for development

7. **Configuration**
   - Updated `vite.config.ts` to properly handle environment variables
   - Added npm scripts for running frontend + backend
   - Updated `package.json` with new dependencies (cors, concurrently, @types/cors)

## File Structure

```
cafe-saas-super-admin/
├── .env.local                 # Local environment variables (not committed)
├── .env.example              # Template for environment variables
├── package.json              # Updated with new scripts and dependencies
├── vite.config.ts            # Updated env handling
│
├── src/
│   ├── lib/
│   │   ├── config.ts         # NEW: Centralized config
│   │   ├── i18n.tsx
│   │   ├── supabase.ts
│   │   ├── theme.tsx
│   │   └── utils.ts
│   │
│   ├── services/
│   │   ├── api.ts            # NEW: Base HTTP client
│   │   ├── cafesService.ts   # NEW: Cafe API service
│   │   └── subscriptionsService.ts  # NEW: Subscription API service
│   │
│   ├── hooks/
│   │   └── useSubscriptions.ts  # UPDATED: Uses API service
│   │
│   └── components/
│       ├── CafesPage.tsx     # UPDATED: Uses cafesService
│       ├── SubscriptionsPage.tsx  # UPDATED: Async handlers
│       └── ...
│
└── server/
    ├── api.ts                # NEW: Express API server
    └── API.md                # NEW: API documentation
```

## Environment Variables

### Frontend (VITE_ prefix - exposed to browser)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
VITE_APP_ENV=development
VITE_APP_NAME=Cafe SaaS Admin
VITE_ENABLE_DEMO_MODE=true
```

### Backend (Server-only)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cafe_saas
SUPABASE_ADMIN_KEY=your-admin-key-here
SERVER_PORT=5000
SERVER_HOST=localhost
GEMINI_API_KEY=your-gemini-api-key-here
NODE_ENV=development
```

## Running the Application

### Start Frontend Only
```bash
npm run dev
# Runs on http://localhost:3000
# Uses API_URL from .env.local
```

### Start Backend API Server
```bash
npm run dev:server
# Runs on http://localhost:5000/api
# Check health at http://localhost:5000/health
```

### Start Both Simultaneously
```bash
npm run dev:all
# Starts both frontend (port 3000) and backend (port 5000)
```

## Demo Mode

When `VITE_ENABLE_DEMO_MODE=true`, the application:
- Uses mock data directly without API calls
- Functions work offline
- No network requests made
- Useful for development/testing

To disable demo mode:
```env
VITE_ENABLE_DEMO_MODE=false
```

## API Endpoints

See `server/API.md` for complete endpoint documentation.

### Cafes
- `GET /api/cafes` - List all cafes
- `GET /api/cafes/:id` - Get cafe details
- `POST /api/cafes/:id/block` - Block cafe
- `POST /api/cafes/:id/unblock` - Unblock cafe
- `PUT /api/cafes/:id/plan` - Update plan
- `POST /api/cafes/:id/notify` - Send notification
- `DELETE /api/cafes/:id` - Delete cafe

### Subscriptions
- `GET /api/subscriptions` - List all plans
- `GET /api/subscriptions/:id` - Get plan details
- `POST /api/subscriptions` - Create plan
- `PUT /api/subscriptions/:id` - Update plan
- `DELETE /api/subscriptions/:id` - Delete plan

## Next Steps for Production

### 1. Database Integration

Install and configure Prisma:
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

Set `DATABASE_URL` in `.env.local`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/cafe_saas_prod
```

### 2. Authentication

Implement one of:
- JWT-based authentication
- Supabase Auth (already has client setup)
- Custom session management

### 3. Environment-Specific Configs

Create separate env files:
- `.env.development` - Development config
- `.env.staging` - Staging config
- `.env.production` - Production config

### 4. Error Tracking & Logging

Add services like:
- Sentry for error tracking
- Winston/Pino for logging
- Application Performance Monitoring (APM)

### 5. Validation & Security

- Input validation on backend
- Rate limiting
- CORS configuration per environment
- HTTPS enforcement in production

### 6. Testing

- Unit tests for services
- Integration tests for API
- E2E tests for user flows

```bash
npm install -D vitest @testing-library/react
```

### 7. Deployment

- Docker containerization
- GitHub Actions CI/CD
- Environment-specific deployments
- Database migrations in CI/CD pipeline

## Migration Checklist

- [x] Remove hardcoded values
- [x] Create environment variable system
- [x] Build API service layer
- [x] Refactor hooks to use API
- [x] Update components for async operations
- [x] Create Express API server
- [x] Add npm scripts for running both
- [x] Create API documentation
- [ ] Set up database (PostgreSQL)
- [ ] Implement authentication
- [ ] Add error tracking
- [ ] Set up CI/CD pipeline
- [ ] Configure production deployment

## Common Issues & Solutions

### Issue: "VITE_API_URL is not defined"
**Solution:** Make sure `.env.local` file exists with proper VITE_API_URL value

### Issue: API server runs but frontend can't connect
**Solution:** Check VITE_API_URL matches server address exactly (http://localhost:5000/api)

### Issue: CORS errors in browser console
**Solution:** Backend already has CORS enabled for localhost:3000

### Issue: Mock data not showing in demo mode
**Solution:** Verify `VITE_ENABLE_DEMO_MODE=true` in .env.local

## Code Examples

### Using the Service Layer

```typescript
// Before (direct API call)
const response = await fetch('http://localhost:5000/api/cafes');
const cafes = await response.json();

// After (using service)
import { cafesService } from '@/src/services/cafesService';
const cafes = await cafesService.getCafes();
```

### Using Environment Variables

```typescript
// Before (hardcoded)
const API_URL = "http://localhost:3000";

// After (from config)
import { API_URL } from '@/src/lib/config';
```

### Handling Async Operations

```typescript
// Before (sync update)
setCafes(prev => [...prev, newCafe]);

// After (async with error handling)
try {
  const newCafe = await cafesService.blockCafe(id, days, reason);
  setCafes(prev => prev.map(c => c.id === id ? newCafe : c));
} catch (err) {
  console.error('Failed:', err);
  setError(err.message);
}
```

## Support & Questions

Refer to:
- `server/API.md` for API documentation
- `.env.example` for environment setup
- `src/services/` for service implementation details
- Component files for usage examples

## Version History

- **v0.1.0** (MVP) - Initial MVP with environment variables and basic API
- Future: Database integration, authentication, production deployment
