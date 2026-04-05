# Backend TODO - Finn App

This document outlines all the backend API endpoints that need to be implemented to support the new frontend features.

## Overview

The frontend has been extended with new features that require corresponding backend implementations. All endpoints should follow the existing API patterns and use the `X-Init-Data` header for Telegram authentication.

---

## 1. Budget Limits API

### Model: `BudgetLimit`

```typescript
interface BudgetLimit {
  _id: string;
  userId: string;
  category: string;
  limit: number;
  currency: string;
  period: 'daily' | 'weekly' | 'monthly';
  spent: number;  // calculated field
  roomId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Endpoints

#### `GET /api/budget-limit`
- **Query params**: `roomId?: string`
- **Response**: `BudgetLimit[]`
- **Description**: List all budget limits for user or room

#### `POST /api/budget-limit`
- **Body**: `{ category: string, limit: number, currency?: string, period: 'daily' | 'weekly' | 'monthly', roomId?: string }`
- **Response**: `BudgetLimit`
- **Description**: Create a new budget limit

#### `PUT /api/budget-limit/:id`
- **Body**: `{ limit?: number, period?: 'daily' | 'weekly' | 'monthly' }`
- **Response**: `BudgetLimit`
- **Description**: Update budget limit

#### `DELETE /api/budget-limit/:id`
- **Response**: `{ deleted: boolean }`
- **Description**: Delete budget limit

#### `GET /api/budget-limit/status`
- **Query params**: `roomId?: string`
- **Response**: `{ category: string, limit: number, spent: number, percentage: number, isOver: boolean }[]`
- **Description**: Get current spending status for all limits. Calculate `spent` based on transactions in current period.

---

## 2. Notification Settings API

### Model: `NotificationSettings`

```typescript
interface NotificationSettings {
  _id: string;
  userId: string;
  dailyReminder: boolean;
  dailyReminderTime?: string; // HH:mm format
  budgetAlerts: boolean;
  budgetAlertThreshold: number; // percentage (e.g., 80)
  weeklyReport: boolean;
  goalProgress: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Endpoints

#### `GET /api/notification-settings`
- **Response**: `NotificationSettings`
- **Description**: Get user's notification settings. Create default if not exists.

#### `PUT /api/notification-settings`
- **Body**: `Partial<NotificationSettings>`
- **Response**: `NotificationSettings`
- **Description**: Update notification settings

#### `POST /api/notification-settings/test`
- **Response**: `{ sent: boolean }`
- **Description**: Send a test push notification via Telegram

### Background Jobs Required:
- **Daily Reminder Job**: Send daily reminders at configured time via Telegram
- **Budget Alert Job**: Check limits and send alerts when threshold exceeded
- **Weekly Report Job**: Generate and send weekly spending reports
- **Goal Progress Job**: Notify when goals reach milestones (25%, 50%, 75%, 100%)

---

## 3. Recurring Transactions API

### Model: `RecurringTransaction`

```typescript
interface RecurringTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string; // ISO date
  lastTriggered?: string;
  isActive: boolean;
  roomId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Endpoints

#### `GET /api/recurring-transaction`
- **Query params**: `roomId?: string`
- **Response**: `RecurringTransaction[]`
- **Description**: List all recurring transactions

#### `POST /api/recurring-transaction`
- **Body**: `{ amount: number, type: 'income' | 'expense', category: string, description?: string, frequency: string, startDate: string, roomId?: string }`
- **Response**: `RecurringTransaction`
- **Description**: Create recurring transaction. Set `nextDate` to `startDate`.

#### `PUT /api/recurring-transaction/:id`
- **Body**: `Partial<{ amount: number, category: string, frequency: string, isActive: boolean }>`
- **Response**: `RecurringTransaction`
- **Description**: Update recurring transaction

#### `DELETE /api/recurring-transaction/:id`
- **Response**: `{ deleted: boolean }`
- **Description**: Delete recurring transaction

#### `POST /api/recurring-transaction/:id/trigger`
- **Response**: `Transaction`
- **Description**: Manually trigger a recurring transaction (creates actual transaction)

### Background Job Required:
- **Recurring Transaction Processor**: Run daily, check all active recurring transactions where `nextDate <= today`, create transactions, and update `nextDate` based on frequency.

---

## 4. Analytics API

### Endpoints

#### `GET /api/analytics/trends`
- **Query params**: `period: 'week' | 'month' | 'quarter' | 'year', roomId?: string`
- **Response**: `{ period: string, income: number, expense: number, savings: number, change: number }[]`
- **Description**: Get spending/income trends over time. `change` is percentage change from previous period.

#### `GET /api/analytics/compare`
- **Query params**: `from1: string, to1: string, from2: string, to2: string, roomId?: string`
- **Response**: `{ period1: { income: number, expense: number }, period2: { income: number, expense: number }, change: number }`
- **Description**: Compare two time periods

#### `GET /api/analytics/forecast`
- **Query params**: `months: number, roomId?: string`
- **Response**: `{ month: string, predictedIncome: number, predictedExpense: number, predictedSavings: number }[]`
- **Description**: Forecast future spending based on historical data. Use simple moving average or linear regression.

#### `GET /api/analytics/category-breakdown`
- **Query params**: `from?: string, to?: string, roomId?: string`
- **Response**: `{ category: string, amount: number, percentage: number, trend: 'up' | 'down' | 'stable' }[]`
- **Description**: Get category breakdown with trends. `trend` compares to previous period.

---

## 5. Export API

### Model: `ExportJob`

```typescript
interface ExportJob {
  _id: string;
  userId: string;
  format: 'csv' | 'pdf' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  options: {
    from?: string;
    to?: string;
    includeCategories: boolean;
    includeReceipts: boolean;
    roomId?: string;
  };
  createdAt: Date;
}
```

### Endpoints

#### `POST /api/export/generate`
- **Body**: `{ format: 'csv' | 'pdf' | 'json', from?: string, to?: string, includeCategories?: boolean, includeReceipts?: boolean, roomId?: string }`
- **Response**: `{ downloadUrl: string, expiresAt: string }`
- **Description**: Generate export file. Can be sync for small datasets or async with job queue.

**CSV Format Example:**
```csv
Date,Type,Category,Amount,Currency,Description
2024-01-15,expense,food,25.50,USD,Lunch at cafe
2024-01-15,income,salary,3000.00,USD,Monthly salary
```

**PDF Format**: Generate a formatted report with charts and summaries.

**JSON Format**: Full transaction data export.

#### `GET /api/export/download/:token`
- **Response**: File blob
- **Description**: Download generated export file

#### `GET /api/export/history`
- **Response**: `{ _id: string, format: string, createdAt: string, downloadUrl: string }[]`
- **Description**: List recent exports

### Storage:
- Store generated files in object storage (S3, Vercel Blob, etc.)
- Set expiration (e.g., 24 hours)
- Clean up expired files via background job

---

## 6. Currency API

### Endpoints

#### `GET /api/currency/rates`
- **Query params**: `base?: string` (default: USD)
- **Response**: `{ base: string, rates: Record<string, number>, updatedAt: string }`
- **Description**: Get current exchange rates. Cache rates and refresh every hour from external API (e.g., exchangerate-api.com, fixer.io).

#### `GET /api/currency/convert`
- **Query params**: `amount: number, from: string, to: string`
- **Response**: `{ amount: number, from: string, to: string, result: number, rate: number }`
- **Description**: Convert amount between currencies

### External API Integration:
- Use free tier of exchange rate API
- Cache rates in Redis/memory
- Fallback to last known rates if API unavailable

---

## 7. Translations Required

Add these translation keys to `locales/`:

```json
{
  "goals": {
    "title": "Savings Goals",
    "add": "Add Goal",
    "edit": "Edit Goal",
    "create": "Create",
    "created": "Goal created",
    "updated": "Goal updated",
    "deleted": "Goal deleted",
    "confirmDelete": "Delete this goal?",
    "fillRequired": "Fill in required fields",
    "titleLabel": "Goal Name",
    "titlePlaceholder": "e.g., New Car",
    "targetAmount": "Target Amount",
    "currentAmount": "Current Amount",
    "deadline": "Target Date",
    "daysRemaining": "{{days}} days left",
    "dueToday": "Due today",
    "overdue": "{{days}} days overdue",
    "empty": "No goals yet. Create one to start saving!"
  },
  "budgetLimits": {
    "title": "Budget Limits",
    "add": "Add Limit",
    "edit": "Edit Limit",
    "create": "Create",
    "created": "Limit created",
    "updated": "Limit updated",
    "deleted": "Limit deleted",
    "confirmDelete": "Delete this limit?",
    "invalidAmount": "Enter a valid amount",
    "category": "Category",
    "limitAmount": "Limit Amount",
    "periodLabel": "Period",
    "period": {
      "daily": "Daily",
      "weekly": "Weekly",
      "monthly": "Monthly"
    },
    "overBy": "Over by {{amount}}",
    "overBudgetCount": "{{count}} categories over budget!",
    "warningCount": "{{count}} categories near limit",
    "empty": "No budget limits set. Add one to track spending!"
  },
  "export": {
    "title": "Export Data",
    "format": "Format",
    "period": "Period",
    "allTime": "All Time",
    "thisMonth": "This Month",
    "thisQuarter": "This Quarter",
    "thisYear": "This Year",
    "customRange": "Custom",
    "from": "From",
    "to": "To",
    "includeCategories": "Include category breakdown",
    "includeReceipts": "Include receipt images",
    "download": "Download",
    "generating": "Generating...",
    "success": "Export ready!"
  }
}
```

---

## Implementation Priority

### Phase 1 (Core)
1. Budget Limits API - enables expense tracking limits
2. Goals API improvements - frontend ready, backend already exists
3. Export API (CSV only) - basic data export

### Phase 2 (Enhanced)
4. Notification Settings API - requires Telegram bot integration
5. Recurring Transactions API - automate regular expenses/income
6. Analytics API - trends and forecasting

### Phase 3 (Polish)
7. Currency API - multi-currency support
8. Export API (PDF/JSON) - enhanced export options
9. Background jobs for all automated features

---

## Technical Notes

### Authentication
All endpoints use existing Telegram WebApp authentication via `X-Init-Data` header. Parse and validate using existing `authMiddleware`.

### Database
Use existing MongoDB setup. Create new collections:
- `budgetlimits`
- `notificationsettings`
- `recurringtransactions`
- `exportjobs`

### Background Jobs
Recommend using:
- `node-cron` for simple scheduling
- or `Bull` queue for more complex job management

### Rate Limiting
Consider adding rate limits to:
- Export generation (max 5/hour)
- Currency API calls (cached, but limit user requests)

---

## Testing Checklist

- [ ] Budget limits CRUD operations
- [ ] Budget status calculation with transactions
- [ ] Notification settings persistence
- [ ] Telegram notification delivery
- [ ] Recurring transaction creation and triggering
- [ ] Analytics data accuracy
- [ ] Export file generation (CSV, PDF, JSON)
- [ ] Currency conversion accuracy
- [ ] Background job reliability
- [ ] Error handling and edge cases
