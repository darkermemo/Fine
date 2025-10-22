# ⚡ Quick Start - Subscription System Testing

## 🎯 Goal: Get your subscription system running in 5 minutes

---

## Step 1: Kill Old Process & Start Fresh (if needed)

```bash
# Kill any existing process on port 5001
lsof -ti:5001 | xargs kill -9

# Go to your project
cd /Users/yasser2/Desktop/Fines/off-the-record-app

# Make sure you have all dependencies
npm install

# Start the server
npm run dev
```

**Expected Output:**
```
[dotenv@17.2.3] injecting env (11) from backend/.env
[nodemon] starting `node backend/server.js`
✅ Server running on port 5001
✅ Supabase client initialized
```

---

## Step 2: Create Test Data

### Get Admin Token First

```bash
# Register as admin
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Test@12345",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

**Response includes `token` - SAVE THIS!**

```bash
export ADMIN_TOKEN="your_token_here"
```

---

## Step 3: Create a Test Plan (Admin Only)

```bash
curl -X POST http://localhost:5001/api/admin/subscription/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Startup Plan",
    "slug": "startup",
    "description": "Perfect for startups",
    "monthly_price": 500,
    "setup_fee": 100,
    "max_fines_per_month": 20,
    "max_employees": 5,
    "is_active": true,
    "features": {
      "reporting": true,
      "priority_support": false,
      "api_access": false,
      "custom_negotiation": false
    }
  }'
```

**Response:**
```json
{
  "id": "plan-uuid-123",
  "name": "Startup Plan",
  "monthly_price": 500,
  "status": "Plan created successfully"
}
```

**SAVE THE PLAN ID!**
```bash
export PLAN_ID="plan-uuid-123"
```

---

## Step 4: View All Plans

```bash
curl -X GET http://localhost:5001/api/admin/subscription/plans \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response: List of all plans with pricing**

---

## Step 5: Create Customer Account

```bash
# Register as customer
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "Test@12345",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }'
```

**Response includes `token` - SAVE THIS!**

```bash
export CUSTOMER_TOKEN="your_token_here"
```

---

## Step 6: Initiate Checkout (Customer)

```bash
curl -X POST http://localhost:5001/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "plan_id": "'$PLAN_ID'",
    "company_name": "Test Company LLC",
    "company_registration": "CR-123456",
    "business_type": "delivery",
    "contact_email": "john@testcompany.com",
    "contact_phone": "+966501234567",
    "contact_person": "John Doe",
    "city": "Riyadh",
    "region": "Riyadh"
  }'
```

**Response includes:**
```json
{
  "business_id": "business-uuid-123",
  "checkout_url": "https://checkout.stripe.com/pay/...",
  "session_id": "cs_test_..."
}
```

**SAVE THESE VALUES!**
```bash
export BUSINESS_ID="business-uuid-123"
export SESSION_ID="cs_test_..."
export CHECKOUT_URL="https://checkout.stripe.com/pay/..."
```

---

## Step 7: Complete Payment (In Stripe Test Mode)

### Using Stripe Test Card

1. **Open the checkout URL in browser:**
   ```
   https://checkout.stripe.com/pay/...
   ```

2. **Fill in test card info:**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25` (any future date)
   - CVC: `123` (any 3 digits)
   - Name: `John Doe`

3. **Click "Pay"**

---

## Step 8: Confirm Payment & Activate (Customer)

```bash
curl -X POST http://localhost:5001/api/subscriptions/confirm-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "business_id": "'$BUSINESS_ID'"
  }'
```

**Response:**
```json
{
  "status": "Subscription activated successfully",
  "subscription": {
    "id": "sub-uuid",
    "status": "active",
    "plan_name": "Startup Plan",
    "renewal_date": "2025-11-22"
  }
}
```

✅ **SUBSCRIPTION NOW ACTIVE!**

---

## Step 9: Check Subscription Status

```bash
curl -X GET http://localhost:5001/api/subscriptions/$BUSINESS_ID/status \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

**Response shows:**
- Plan name
- Usage (fines submitted / limit)
- Renewal date
- Features enabled

---

## Step 10: Test Admin Controls

### Change Price Instantly

```bash
curl -X PUT http://localhost:5001/api/admin/subscription/plans/$PLAN_ID/pricing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "monthly_price": 600,
    "max_fines_per_month": 25
  }'
```

**Response:**
```json
{
  "status": "Plan pricing updated",
  "old_price": 500,
  "new_price": 600,
  "effective_immediately": true
}
```

✅ **NEW PRICE TAKES EFFECT NOW!**

---

### Update Features

```bash
curl -X PUT http://localhost:5001/api/admin/subscription/plans/$PLAN_ID/features \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "reporting": true,
    "priority_support": true,
    "api_access": true,
    "custom_negotiation": false
  }'
```

**Response:**
```json
{
  "status": "Features updated",
  "plan": "Startup Plan",
  "features": {...}
}
```

✅ **NEW FEATURES AVAILABLE IMMEDIATELY!**

---

### View Analytics

```bash
curl -X GET http://localhost:5001/api/admin/subscription/analytics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response includes:**
```json
{
  "total_businesses": 1,
  "total_paid_revenue": 600,
  "pending_revenue": 0,
  "monthly_recurring_revenue": 500,
  "annual_recurring_revenue": 6000,
  "by_plan": {
    "Startup Plan": {
      "count": 1,
      "monthly_revenue": 500,
      "annual_revenue": 6000
    }
  }
}
```

📊 **REAL-TIME ANALYTICS!**

---

## Step 11: Test Upgrade/Downgrade (Customer)

First, create another plan:

```bash
curl -X POST http://localhost:5001/api/admin/subscription/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Professional Plan",
    "slug": "professional",
    "description": "For growing businesses",
    "monthly_price": 1500,
    "setup_fee": 0,
    "max_fines_per_month": 100,
    "max_employees": 50,
    "is_active": true,
    "features": {
      "reporting": true,
      "priority_support": true,
      "api_access": true,
      "custom_negotiation": true
    }
  }'
```

Save the new plan ID:
```bash
export PRO_PLAN_ID="new-plan-uuid"
```

Now upgrade:

```bash
curl -X POST http://localhost:5001/api/subscriptions/$BUSINESS_ID/change-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "new_plan_id": "'$PRO_PLAN_ID'"
  }'
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/...",
  "session_id": "cs_test_...",
  "current_plan": "Startup Plan",
  "new_plan": "Professional Plan",
  "prorated_amount": 1000
}
```

---

## 🎉 You're Done!

You now have:

✅ Admin creating plans  
✅ Admin changing prices instantly  
✅ Admin updating features  
✅ Admin viewing analytics  
✅ Customers purchasing subscriptions  
✅ Real Stripe integration  
✅ Active subscriptions  
✅ Upgrade/downgrade capability  

---

## 📝 Quick Reference

### Environment Variables to Save

```bash
export ADMIN_TOKEN="your_admin_token"
export CUSTOMER_TOKEN="your_customer_token"
export PLAN_ID="your_plan_id"
export BUSINESS_ID="your_business_id"
export SESSION_ID="your_session_id"
```

### Common Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/subscription/plans` | GET | Get all plans |
| `/api/admin/subscription/plans` | POST | Create plan |
| `/api/admin/subscription/plans/{id}/pricing` | PUT | Change price |
| `/api/admin/subscription/plans/{id}/features` | PUT | Update features |
| `/api/admin/subscription/analytics` | GET | View analytics |
| `/api/subscriptions/checkout` | POST | Start checkout |
| `/api/subscriptions/confirm-payment` | POST | Activate sub |
| `/api/subscriptions/{id}/status` | GET | Check status |
| `/api/subscriptions/{id}/change-plan` | POST | Upgrade/downgrade |

### Stripe Test Card

- **Card:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **Result:** Charge succeeds immediately

---

## ✨ What Happens Behind the Scenes

1. **Checkout Initiated** → Business account created (pending)
2. **Payment Succeeded** → Webhook from Stripe received
3. **Confirm Payment Called** → Subscription activated
4. **Email Sent** → Confirmation to business owner
5. **Invoice Generated** → Ready for download
6. **Usage Tracking Started** → Count fine submissions
7. **Renewal Set** → 30 days from now

---

**Ready to launch? You're all set! 🚀**
