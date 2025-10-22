# 💼 B2B Subscription System - Complete Guide

## 🎯 Business Model

**Subscription-Based Fine Management for Companies**

Companies get **up to 20 free fines per month** for a flat fee, with pricing tiers:

```
STARTER (500 SAR/month)
├─ 20 free fines/month
├─ Up to 5 employees
└─ Basic reporting

PROFESSIONAL (1,500 SAR/month) + 500 SAR setup
├─ 50 free fines/month
├─ Up to 20 employees
├─ Advanced reporting
├─ Priority support
└─ Custom negotiation

ENTERPRISE (Custom, 5,000+ SAR/month) + 2,000 SAR setup
├─ Unlimited fines/month
├─ Unlimited employees
├─ API access
├─ Dedicated account manager
└─ Custom integrations

Extra fines beyond limit: 50 SAR each
```

---

## 📊 Revenue Impact

```
Scenario: 100 Business Subscribers

STARTER TIER (60 businesses):
├─ Monthly: 60 × 500 = 30,000 SAR
└─ Annual: 360,000 SAR

PROFESSIONAL TIER (35 businesses):
├─ Monthly: 35 × 1,500 = 52,500 SAR
└─ Annual: 630,000 SAR

ENTERPRISE TIER (5 businesses):
├─ Monthly: 5 × 5,000 = 25,000 SAR
└─ Annual: 300,000 SAR

TOTAL SUBSCRIPTION REVENUE:
├─ Monthly: 107,500 SAR
├─ Annual: 1,290,000 SAR
└─ Plus: Extra fines (~20% upcharge) = +258,000 SAR/year

TOTAL ANNUAL B2B REVENUE: ~1.55M SAR
```

---

## 🗄️ Database Schema

### Main Tables Created

```
business_subscription_plans
├─ id: UUID
├─ name: "Starter", "Professional", "Enterprise"
├─ monthly_price: 500, 1500, 5000
├─ max_fines_per_month: 20, 50, NULL (unlimited)
├─ max_employees: 5, 20, NULL (unlimited)
└─ features: JSONB (reporting, priority_support, api_access)

business_accounts
├─ id: UUID (company account)
├─ company_name: VARCHAR
├─ stripe_customer_id: VARCHAR (for auto-billing)
├─ plan_id: FK to business_subscription_plans
├─ subscription_starts: TIMESTAMP
├─ subscription_renews: TIMESTAMP
├─ auto_renew: BOOLEAN
└─ is_verified: BOOLEAN

business_employees
├─ id: UUID
├─ business_id: FK
├─ user_id: FK (existing user)
├─ role: 'admin', 'manager', 'employee'
├─ can_submit_fines: BOOLEAN
├─ fines_submitted: INT (tracked)
└─ fines_this_month: INT

business_fine_submissions
├─ id: UUID
├─ business_id: FK
├─ employee_id: FK
├─ fine_type_id: FK
├─ included_in_plan: BOOLEAN (TRUE = free, FALSE = extra charge)
├─ extra_charge: INT (50 SAR if over limit)
└─ status: 'submitted', 'approved', 'paid', 'cancelled'

business_monthly_usage
├─ id: UUID
├─ business_id: FK
├─ year: INT
├─ month: INT
├─ fines_submitted: INT
├─ fines_included: INT
├─ fines_extra: INT
├─ extra_fine_cost: INT (fines_extra × 50)
└─ UNIQUE(business_id, year, month)

business_billing_history
├─ id: UUID
├─ business_id: FK
├─ invoice_number: VARCHAR UNIQUE
├─ billing_period_start: DATE
├─ billing_period_end: DATE
├─ plan_fee: INT
├─ extra_fines_cost: INT
├─ tax: INT (15% VAT)
├─ total: INT
├─ payment_status: 'pending', 'paid', 'failed'
└─ stripe_charge_id: VARCHAR
```

---

## 📡 API Endpoints

### 1. Get Subscription Plans
```bash
GET /api/b2b/plans

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Starter",
      "monthly_price": 500,
      "max_fines_per_month": 20,
      "features": { "reporting": false, ... }
    }
  ]
}
```

### 2. Create Business Account
```bash
POST /api/b2b/accounts
Authorization: Bearer {JWT_TOKEN}

Body:
{
  "company_name": "ABC Delivery",
  "company_registration": "12345678",
  "business_type": "delivery",
  "contact_email": "admin@abc.com",
  "contact_phone": "+966501234567",
  "contact_person": "Ahmed Ali",
  "city": "Riyadh",
  "region": "Riyadh",
  "plan_id": "uuid-of-starter-plan"
}

Response:
{
  "success": true,
  "message": "Business account created successfully",
  "data": {
    "id": "business-uuid",
    "company_name": "ABC Delivery",
    "stripe_customer_id": "cus_...",
    "subscription_starts": "2025-10-22T...",
    "subscription_renews": "2025-11-22T..."
  }
}
```

### 3. Get Business Account
```bash
GET /api/b2b/accounts/:businessId
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "data": {
    "id": "business-uuid",
    "company_name": "ABC Delivery",
    "plan": { "name": "Starter", "max_fines_per_month": 20 },
    "current_month_usage": {
      "fines_submitted": 15,
      "fines_included": 15,
      "fines_extra": 0
    }
  }
}
```

### 4. Add Employee
```bash
POST /api/b2b/accounts/:businessId/employees
Authorization: Bearer {JWT_TOKEN}

Body:
{
  "user_id": "user-uuid",
  "full_name": "Mohammed Ahmed",
  "email": "mohammed@abc.com",
  "phone": "+966501111111",
  "id_number": "1234567890",
  "role": "employee"
}

Response:
{
  "success": true,
  "message": "Employee added successfully",
  "data": {
    "id": "employee-uuid",
    "business_id": "business-uuid",
    "user_id": "user-uuid",
    "role": "employee",
    "can_submit_fines": true
  }
}
```

### 5. Get Business Employees
```bash
GET /api/b2b/accounts/:businessId/employees
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "emp-1",
      "full_name": "Mohammed Ahmed",
      "email": "mohammed@abc.com",
      "role": "employee",
      "fines_submitted": 5,
      "fines_this_month": 5
    }
  ]
}
```

### 6. Submit Fine for Business
```bash
POST /api/b2b/accounts/:businessId/submit-fine
Authorization: Bearer {JWT_TOKEN}

Body:
{
  "case_id": "case-uuid",
  "fine_type_id": "fine-type-uuid",
  "fine_amount": 1000,
  "employee_id": "employee-uuid"
}

Response:
{
  "success": true,
  "message": "Fine submitted successfully",
  "data": {
    "submission": {
      "id": "submission-uuid",
      "business_id": "business-uuid",
      "included_in_plan": true,
      "extra_charge": 0,
      "status": "submitted"
    },
    "usage": {
      "fines_used": 16,
      "fines_limit": 20,
      "message": "Within limit",
      "extra_charge": 0
    }
  }
}
```

**Response when exceeding limit:**
```json
{
  "usage": {
    "fines_used": 21,
    "fines_limit": 20,
    "message": "Limit exceeded - extra charges will apply",
    "extra_charge": 50
  }
}
```

### 7. Get Billing History
```bash
GET /api/b2b/accounts/:businessId/billing?limit=12&offset=0
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "bill-uuid",
      "invoice_number": "INV-abc123-202510",
      "billing_period_start": "2025-10-01",
      "billing_period_end": "2025-10-31",
      "plan_fee": 500,
      "extra_fines_count": 5,
      "extra_fines_cost": 250,
      "subtotal": 750,
      "tax": 113,
      "total": 863,
      "payment_status": "paid"
    }
  ]
}
```

### 8. Create Monthly Invoice
```bash
POST /api/b2b/accounts/:businessId/invoice
Authorization: Bearer {JWT_TOKEN}
Role: admin

Body:
{
  "month": 10,
  "year": 2025
}

Response:
{
  "success": true,
  "message": "Invoice created",
  "data": {
    "id": "invoice-uuid",
    "invoice_number": "INV-abc123-202510",
    "plan_fee": 500,
    "extra_fines_count": 3,
    "extra_fines_cost": 150,
    "subtotal": 650,
    "tax": 98,
    "total": 748,
    "payment_status": "pending"
  }
}
```

### 9. Get Business Analytics
```bash
GET /api/b2b/accounts/:businessId/analytics
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "data": {
    "current_month": {
      "fines_submitted": 15,
      "fines_included": 15,
      "fines_extra": 0,
      "extra_fine_cost": 0
    },
    "submissions_this_month": 15,
    "fine_types_breakdown": [
      {
        "fine_type_id": "uuid",
        "fine_type_name": "Speeding 1-20 km/h",
        "count": 8
      },
      {
        "fine_type_id": "uuid",
        "fine_type_name": "Parking Violation",
        "count": 7
      }
    ],
    "plan_limit": 20,
    "fines_remaining": 5
  }
}
```

---

## 💳 Billing Workflow

### Automatic Monthly Invoicing

```
On the 1st of each month:
1. Calculate usage from previous month
2. Get plan details
3. Calculate:
   - Base plan fee
   - Extra fines cost (if any)
   - 15% VAT
   - Total
4. Create invoice
5. Charge via Stripe (if auto_renew = true)
6. Send invoice email
7. Update payment status
```

### Invoice Calculation Example

```
STARTER Tier (500 SAR/month):
Fines submitted: 25 (20 included + 5 extra)

Costs:
├─ Plan fee: 500 SAR
├─ Extra fines: 5 × 50 = 250 SAR
├─ Subtotal: 750 SAR
├─ Tax (15%): 113 SAR
└─ Total: 863 SAR

Amount charged to business: 863 SAR
Amount to platform: 863 SAR (recurring monthly)
```

---

## 🔄 Implementation Workflow

### Step 1: Business Signs Up
```
1. User clicks "For Business" on landing page
2. Sees 3 subscription plans
3. Selects plan and clicks "Sign Up"
4. Enters company details
5. Account created with Stripe customer ID
6. Manager added as admin employee
7. Monthly usage record created
8. Email sent with setup instructions
```

### Step 2: Manager Adds Employees
```
1. Manager logs in to B2B dashboard
2. Goes to "Manage Employees"
3. Invites employees by email
4. Assigns roles (admin, manager, employee)
5. Sets permissions per employee
6. Employees receive invite link
7. Employees accept and create account
```

### Step 3: Employees Submit Fines
```
1. Employee logs in to B2B portal
2. Clicks "Submit Fine"
3. System checks monthly limit
4. Shows fee breakdown:
   - Fine amount
   - Admin fee
   - Included in plan? YES or NO (if over limit)
5. Employee uploads required documents
6. Fine submitted
7. If over limit: notification sent to manager
8. Manager can still submit (extra charge applied)
```

### Step 4: Monthly Billing
```
At end of month:
1. System calculates usage
2. Creates invoice with:
   - Plan fee
   - Extra fines cost
   - 15% VAT
3. Automatically charges Stripe
4. Sends invoice email
5. Updates payment status
6. Resets monthly counter
```

---

## 📊 Sample B2B Dashboard

```
┌─────────────────────────────────────────────────────────┐
│          ABC DELIVERY - B2B DASHBOARD                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Plan: PROFESSIONAL (50 free fines/month)              │
│  Monthly Cost: 1,500 SAR                               │
│  Renewal: November 22, 2025                            │
│                                                         │
│  THIS MONTH'S USAGE:                                    │
│  ├─ Fines Submitted: 42 / 50                           │
│  ├─ Fines Remaining: 8                                 │
│  ├─ Extra Fines: 0 (0 SAR extra cost)                  │
│  └─ Current Month Total: 1,500 SAR                     │
│                                                         │
│  FINE BREAKDOWN:                                        │
│  ├─ Speeding: 18                                       │
│  ├─ Parking: 15                                        │
│  ├─ Traffic Signals: 6                                 │
│  └─ Other: 3                                           │
│                                                         │
│  EMPLOYEES (12 total):                                 │
│  ├─ Active: 10                                         │
│  ├─ Inactive: 2                                        │
│  └─ Top Submitter: Mohammed (18 fines)                │
│                                                         │
│  RECENT PAYMENTS:                                       │
│  ├─ Sep 2025: 1,500 SAR ✓ Paid                         │
│  ├─ Aug 2025: 1,750 SAR ✓ Paid (+250 extra)           │
│  └─ Jul 2025: 1,500 SAR ✓ Paid                         │
│                                                         │
│  [Submit Fine] [Manage Employees] [Billing] [Settings] │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ Technical Implementation

### Database Execution
```bash
export SUPABASE_DB_URL="postgresql://postgres:12345Qwert@db.hzulecfeysuxatmmyxzc.supabase.co:5432/postgres?sslmode=require"
psql "$SUPABASE_DB_URL" -f backend/config/b2b-subscription-schema.sql
```

### Server Integration
Routes automatically added:
```
GET /api/b2b/plans
POST /api/b2b/accounts
GET /api/b2b/accounts/:businessId
PUT /api/b2b/accounts/:businessId
POST /api/b2b/accounts/:businessId/employees
GET /api/b2b/accounts/:businessId/employees
PUT /api/b2b/accounts/:businessId/employees/:employeeId
POST /api/b2b/accounts/:businessId/submit-fine
GET /api/b2b/accounts/:businessId/billing
POST /api/b2b/accounts/:businessId/invoice
GET /api/b2b/accounts/:businessId/analytics
```

---

## 🎯 Key Features

### ✅ Automatic Usage Tracking
- Real-time fine count per month
- Automatic limit enforcement
- Extra charge calculation

### ✅ Flexible Employee Management
- Add/remove employees
- Role-based access (admin, manager, employee)
- Individual permissions

### ✅ Smart Billing
- Automatic monthly invoicing
- Extra fine surcharges (50 SAR each)
- 15% VAT calculation
- Stripe integration for auto-payment

### ✅ Analytics & Reporting
- Monthly usage dashboard
- Fine type breakdown
- Employee performance tracking
- Payment history

### ✅ Notification System
- Limit warning (at 80%)
- Limit exceeded alerts
- Invoice notifications
- Payment reminders

---

## 💡 Business Benefits

For **Off-The-Record Platform:**
- 1.55M SAR annual recurring revenue (100 businesses)
- Predictable revenue stream
- Higher margins than commission-only model
- Better customer retention (sticky due to employee integrations)

For **Business Customers:**
- Flat monthly cost (no surprises)
- Easy employee management
- Bulk fine submission
- Detailed analytics & reporting

---

## 🚀 Deployment Checklist

- [ ] Execute B2B schema in Supabase
- [ ] Verify Stripe integration
- [ ] Test subscription plan creation
- [ ] Test business account creation
- [ ] Test employee management
- [ ] Test fine submission with limits
- [ ] Test billing calculation
- [ ] Test automatic invoicing
- [ ] Setup email notifications
- [ ] Create B2B landing page
- [ ] Launch to first 5 beta customers
- [ ] Gather feedback
- [ ] Full market launch

---

## 📞 Support & Questions

All B2B endpoints are at: `http://localhost:5001/api/b2b/`

Schema file: `backend/config/b2b-subscription-schema.sql`
Controller: `backend/controllers/b2bSubscriptionController.js`
Routes: `backend/routes/b2bSubscriptionRoutes.js`

---

**B2B System Status: ✅ COMPLETE & READY FOR INTEGRATION**
