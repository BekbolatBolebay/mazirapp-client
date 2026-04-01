# API Documentation

## Overview

This is the MVP backend API for the Cafe SaaS Admin application. It provides endpoints for managing cafes and subscriptions.

**Base URL:** `http://localhost:5000/api`

## Setup

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
API_URL=http://localhost:5000/api
DATABASE_URL=postgresql://user:password@localhost:5432/cafe_saas
SERVER_PORT=5000
SERVER_HOST=localhost
NODE_ENV=development
```

### Running the API Server

Development mode (with auto-reload):
```bash
npm run dev:server
```

Running both frontend and server simultaneously:
```bash
npm run dev:all
```

## Authentication

Currently, the API uses no authentication (demo mode). In production, implement:
- JWT tokens
- API key authentication
- OAuth2 integration

## Endpoints

### Cafes

#### GET `/api/cafes`
Get all cafes.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Green Garden Cafe",
    "logo": "https://...",
    "city": "Алматы",
    "address": "...",
    "plan": "Premium",
    "status": "active",
    "expiry": "2025-12-20",
    "blockUntil": null,
    "blockReason": null,
    "notifications": []
  }
]
```

#### GET `/api/cafes/:id`
Get a single cafe by ID.

**Response:** Single cafe object (same structure as above)

#### POST `/api/cafes/:id/block`
Block a cafe for a specified number of days.

**Request Body:**
```json
{
  "blockDays": 7,
  "blockReason": "Payment overdue"
}
```

**Response:** Updated cafe object with `status: "blocked"`

#### POST `/api/cafes/:id/unblock`
Unblock a previously blocked cafe.

**Response:** Updated cafe object with `status: "active"`

#### PUT `/api/cafes/:id/plan`
Update a cafe's subscription plan.

**Request Body:**
```json
{
  "planId": "2"
}
```

**Response:** Updated cafe object with new plan

#### POST `/api/cafes/:id/notify`
Send a notification to a cafe owner.

**Request Body:**
```json
{
  "subject": "Payment Reminder",
  "message": "Your subscription expires on..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent"
}
```

#### DELETE `/api/cafes/:id`
Delete a cafe from the system.

**Response:**
```json
{
  "success": true,
  "message": "Cafe deleted"
}
```

### Subscriptions

#### GET `/api/subscriptions`
Get all available subscription plans.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Basic",
    "description": "...",
    "price": 2900,
    "period": "month",
    "status": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET `/api/subscriptions/:id`
Get a single subscription plan.

**Response:** Single subscription object

#### POST `/api/subscriptions`
Create a new subscription plan.

**Request Body:**
```json
{
  "name": "Enterprise",
  "description": "Full-featured plan",
  "price": 29900,
  "period": "month",
  "status": true
}
```

**Response:** Created subscription object with generated ID

#### PUT `/api/subscriptions/:id`
Update a subscription plan.

**Request Body:** Any fields to update (same structure as POST)

**Response:** Updated subscription object

#### DELETE `/api/subscriptions/:id`
Delete a subscription plan.

**Response:**
```json
{
  "success": true,
  "message": "Subscription deleted"
}
```

### Health Check

#### GET `/health`
Check if the API server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Error Handling

All errors return appropriate HTTP status codes:

- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Data Storage

**Current:** Mock data stored in memory (lost on server restart)

**Next Steps for Production:**
1. Connect to PostgreSQL database
2. Implement migrations for schema management
3. Add data validation layer
4. Implement proper error handling and logging
5. Add rate limiting and security measures

## Frontend Integration

The frontend uses API client services in `/src/services/`:
- `api.ts` - Base HTTP client
- `cafesService.ts` - Cafe operations
- `subscriptionsService.ts` - Subscription operations

Environment variable `VITE_API_URL` controls the API endpoint:
```env
VITE_API_URL=http://localhost:5000/api
```

## Demo Mode

Set `VITE_ENABLE_DEMO_MODE=true` in `.env.local` to use mock data without API calls:
```env
VITE_ENABLE_DEMO_MODE=true
```

When enabled, the API services return mock data directly without making HTTP requests.

## Future Enhancements

1. **Database Integration**
   - PostgreSQL connection with Prisma ORM
   - Migration and seeding scripts

2. **Authentication**
   - JWT-based auth
   - Role-based access control (RBAC)
   - Session management

3. **Webhooks**
   - Cafe owner notifications
   - Subscription expiry alerts
   - Payment integration

4. **Monitoring & Analytics**
   - Request logging
   - Performance metrics
   - Error tracking

5. **Real-time Features**
   - WebSocket support for live updates
   - Real-time notifications

## Support

For issues or questions, please refer to the main project README.
