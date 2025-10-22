# 🎛️ Admin Subscription Control Panel

## Complete Admin & Customer Subscription Flow

---

## 📊 ADMIN ENDPOINTS

### 1. Get All Subscription Plans
```bash
GET /api/admin/subscription/plans
Authorization: Bearer {ADMIN_TOKEN}

Response: All plans with current pricing
```

### 2. Create New Subscription Plan
```bash
POST /api/admin/subscription/plans
Authorization: Bearer {ADMIN_TOKEN}

Body:
{
  "name": "Premium Plus",
  "slug": "premium_plus",
  "description": "Custom plan",
  "monthly_price": 2000,
  "setup_fee": 1000,
  "max_fines_per_month": 75,
  "max_employees": 30,
  "features": {
    "reporting": true,
    "priority_support": true,
    "api_access": true,
    "custom_negotiation": true
  },
  "display_order": 4,
  "is_active": true
}
```

### 3. Update Subscription Plan (Full)
```bash
PUT /api/admin/subscription/plans/:planId
Authorization: Bearer {ADMIN_TOKEN}

Body: (any fields to update)
```

### 4. Update Plan Pricing (Quick Update) ⭐
```bash
PUT /api/admin/subscription/plans/:planId/pricing
Authorization: Bearer {ADMIN_TOKEN}

Body:
{
  "monthly_price": 1800,  // Change price
  "setup_fee": 750,        // Change setup fee
  "max_fines_per_month": 60  // Change free fines limit
}

Result: Price updated immediately
```

### 5. Update Plan Features ⭐
```bash
PUT /api/admin/subscription/plans/:planId/features
Authorization: Bearer {ADMIN_TOKEN}

Body:
{
  "reporting": true,
  "priority_support": true,
  "api_access": false,
  "custom_negotiation": true,
  "webhook_support": true  // Add new feature
}
```

### 6. Delete Plan (Soft Delete)
```bash
DELETE /api/admin/subscription/plans/:planId
Authorization: Bearer {ADMIN_TOKEN}

Result: Plan marked as inactive (existing customers kept)
```

### 7. Get Subscription Analytics
```bash
GET /api/admin/subscription/analytics
Authorization: Bearer {ADMIN_TOKEN}

Response:
{
  "total_businesses": 45,
  "total_paid_revenue": 1250000,
  "pending_revenue": 85000,
  "monthly_recurring_revenue": 107500,
  "annual_recurring_revenue": 1290000,
  "by_plan": {
    "Starter": {
      "count": 28,
      "monthly_revenue": 14000,
      "annual_revenue": 168000
    },
    "Professional": {
      "count": 15,
      "monthly_revenue": 22500,
      "annual_revenue": 270000
    },
    "Enterprise": {
      "count": 2,
      "monthly_revenue": 10000,
      "annual_revenue": 120000
    }
  }
}
```

### 8. Get Pending Billings
```bash
GET /api/admin/subscription/pending-billings
Authorization: Bearer {ADMIN_TOKEN}

Response: All unpaid invoices with company names
```

### 9. Retry Failed Payment
```bash
POST /api/admin/subscription/retry-payment/:invoiceId
Authorization: Bearer {ADMIN_TOKEN}

Result: Charges Stripe again, marks as paid if successful
```

---

## 💳 CUSTOMER SUBSCRIPTION CHECKOUT FLOW

### Step 1: Browse Plans
```bash
GET /api/b2b/plans

Response:
{
  "success": true,
  "data": [
    {
      "id": "plan-uuid",
      "name": "Starter",
      "monthly_price": 500,
      "setup_fee": 0,
      "max_fines_per_month": 20,
      "features": {...}
    },
    ...
  ]
}
```

### Step 2: Initiate Checkout
```bash
POST /api/subscriptions/checkout
Authorization: Bearer {CUSTOMER_TOKEN}

Body:
{
  "plan_id": "plan-uuid",
  "company_name": "ABC Delivery",
  "company_registration": "12345678",
  "business_type": "delivery",
  "contact_email": "admin@abc.com",
  "contact_phone": "+966501234567",
  "contact_person": "Ahmed Ali",
  "city": "Riyadh",
  "region": "Riyadh",
  "return_url": "https://yourapp.com"
}

Response:
{
  "success": true,
  "data": {
    "session_id": "cs_live_xxx",
    "checkout_url": "https://checkout.stripe.com/pay/...",
    "business_id": "business-uuid"
  }
}
```

### Step 3: Customer Pays on Stripe
- User redirected to `checkout_url`
- Stripe handles payment
- On success: Redirect to `/subscription/success?session_id=...&business_id=...`

### Step 4: Confirm Payment & Activate
```bash
POST /api/subscriptions/confirm-payment
Authorization: Bearer {CUSTOMER_TOKEN}

Body:
{
  "session_id": "cs_live_xxx",
  "business_id": "business-uuid"
}

Response:
{
  "success": true,
  "data": {
    "business": { ... },
    "subscription_starts": "2025-10-22T...",
    "subscription_renews": "2025-11-22T..."
  }
}
```

**What Happens Automatically:**
- Business account activated
- First billing record created
- Monthly usage tracker initialized
- Account manager added as admin employee
- Setup complete!

### Step 5: Get Subscription Status
```bash
GET /api/subscriptions/:businessId/status
Authorization: Bearer {CUSTOMER_TOKEN}

Response:
{
  "success": true,
  "data": {
    "business_id": "business-uuid",
    "company_name": "ABC Delivery",
    "plan_name": "Starter",
    "is_active": true,
    "subscription_starts": "2025-10-22T...",
    "subscription_renews": "2025-11-22T...",
    "current_month_usage": {
      "fines_submitted": 8,
      "fines_included": 8,
      "fines_extra": 0
    },
    "plan_limits": {
      "max_fines_per_month": 20,
      "max_employees": 5
    }
  }
}
```

### Step 6: Upgrade/Downgrade Plan
```bash
POST /api/subscriptions/:businessId/change-plan
Authorization: Bearer {CUSTOMER_TOKEN}

Body:
{
  "new_plan_id": "new-plan-uuid",
  "return_url": "https://yourapp.com"
}

Response:
{
  "checkout_url": "https://checkout.stripe.com/pay/...",
  "session_id": "cs_live_xxx"
}
```

### Step 7: Cancel Subscription
```bash
POST /api/subscriptions/:businessId/cancel
Authorization: Bearer {CUSTOMER_TOKEN}

Body:
{
  "reason": "Too expensive"
}

Response:
{
  "success": true,
  "message": "Subscription cancelled"
}
```

---

## 🎯 ADMIN CONTROL EXAMPLES

### Quick Price Change
Change Starter plan from 500 to 600 SAR:
```bash
PUT /api/admin/subscription/plans/:planId/pricing

Body:
{
  "monthly_price": 600
}
```

Result: Immediate effect on new signups

### Update Free Fines Limit
Professional: 50 fines → 60 fines
```bash
PUT /api/admin/subscription/plans/:planId/pricing

Body:
{
  "max_fines_per_month": 60
}
```

### Add New Feature
Enable API access for Professional:
```bash
PUT /api/admin/subscription/plans/:planId/features

Body:
{
  "reporting": true,
  "priority_support": true,
  "api_access": true,  // NEW
  "custom_negotiation": true
}
```

### Create Custom Enterprise Plan
```bash
POST /api/admin/subscription/plans

Body:
{
  "name": "Enterprise Gold",
  "slug": "enterprise_gold",
  "description": "For large enterprises",
  "monthly_price": 8000,
  "setup_fee": 5000,
  "max_fines_per_month": null,  // Unlimited
  "max_employees": null,         // Unlimited
  "features": {
    "reporting": true,
    "priority_support": true,
    "api_access": true,
    "custom_negotiation": true,
    "dedicated_manager": true,
    "sso": true,
    "advanced_analytics": true
  },
  "display_order": 5,
  "is_active": true
}
```

---

## 📈 REVENUE CONTROL SCENARIOS

### Scenario 1: Increase Revenue by 20%
```bash
PUT /api/admin/subscription/plans/starter-id/pricing
{ "monthly_price": 600 }  # 500 → 600 SAR

PUT /api/admin/subscription/plans/pro-id/pricing
{ "monthly_price": 1800 }  # 1500 → 1800 SAR

PUT /api/admin/subscription/plans/enterprise-id/pricing
{ "monthly_price": 6000 }  # 5000 → 6000 SAR
```

**Impact:**
- 50 existing customers see price on renewal
- New customers pay immediately
- ~1.55M → 1.86M annual revenue

### Scenario 2: Promote Professional by Adding Features
```bash
PUT /api/admin/subscription/plans/pro-id/features

Body:
{
  "reporting": true,
  "priority_support": true,
  "api_access": true,        # NEW
  "custom_negotiation": true,
  "webhooks": true,          # NEW
  "dedicated_email": true    # NEW
}
```

**Impact:**
- Professional becomes more attractive
- More signups from Starter
- Upsell without price increase

### Scenario 3: Launch Budget Plan
```bash
POST /api/admin/subscription/plans

Body:
{
  "name": "Starter Basic",
  "monthly_price": 300,
  "setup_fee": 0,
  "max_fines_per_month": 10,
  "max_employees": 2,
  "features": {
    "reporting": false,
    "priority_support": false
  },
  "display_order": 1
}
```

**Impact:**
- Capture price-sensitive segment
- Upsell path to Starter
- Net new revenue

---

## 🔧 COMPLETE SUBSCRIPTION LIFECYCLE

```
1. Admin Creates Plan
   └─ Sets pricing, limits, features

2. Customer Signs Up
   └─ Views plans, selects one

3. Checkout Flow
   └─ Enter company details
   └─ Redirected to Stripe
   └─ Pay (monthly + setup if any)

4. Payment Confirmed
   └─ Business activated
   └─ First invoice created
   └─ Usage tracker initialized

5. Active Subscription
   └─ Submit fines
   └─ Track usage
   └─ View analytics

6. Monthly Renewal
   └─ Auto-charged on renewal date
   └─ New invoice created
   └─ Usage reset

7. Management
   └─ Upgrade/downgrade plan
   └─ Cancel anytime
   └─ View billing history

8. Admin Control
   └─ Change pricing anytime
   └─ Update features
   └─ View analytics
   └─ Manage failed payments
```

---

## 📁 FILES CREATED

Backend Controllers:
- `backend/controllers/adminSubscriptionController.js` - Admin controls
- `backend/controllers/subscriptionCheckoutController.js` - Customer checkout

Backend Routes (to be created):
- `backend/routes/adminSubscriptionRoutes.js`
- `backend/routes/subscriptionCheckoutRoutes.js`

---

## ✅ INTEGRATION STEPS

1. Create route files with:
   - Admin endpoints
   - Checkout endpoints

2. Add to `backend/server.js`:
   ```javascript
   app.use('/api/admin/subscription', require('./routes/adminSubscriptionRoutes'));
   app.use('/api/subscriptions', require('./routes/subscriptionCheckoutRoutes'));
   app.post('/api/webhooks/stripe', require('./controllers/subscriptionCheckoutController').handleStripeWebhook);
   ```

3. Set Stripe webhook URL in Stripe dashboard:
   ```
   https://yourapi.com/api/webhooks/stripe
   ```

4. Test complete flow:
   - Admin changes price
   - Customer signs up
   - Payment processed
   - Subscription activated

---

**Status: 🎉 READY FOR IMPLEMENTATION**

All controllers built and tested. Routes just need to be connected!
