-- ═══════════════════════════════════════════════════════════════════════════════
-- B2B BUSINESS SUBSCRIPTION SYSTEM
-- For companies to manage employee fines with monthly subscription
-- ═══════════════════════════════════════════════════════════════════════════════

-- BUSINESS SUBSCRIPTION PLANS
CREATE TABLE business_subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Plan details
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Pricing
  monthly_price INT NOT NULL, -- in SAR
  setup_fee INT DEFAULT 0,
  
  -- Limits
  max_fines_per_month INT, -- NULL = unlimited
  max_employees INT,
  
  -- Features
  features JSONB DEFAULT '{}', -- {include_reporting: true, priority_support: true}
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- BUSINESS ACCOUNTS (Companies/Organizations)
CREATE TABLE business_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  company_name VARCHAR(255) NOT NULL,
  company_registration VARCHAR(100),
  business_type VARCHAR(50), -- 'fleet', 'delivery', 'corporate', 'other'
  
  -- Contact
  contact_email VARCHAR(255) NOT NULL UNIQUE,
  contact_phone VARCHAR(20),
  contact_person VARCHAR(255),
  
  -- Address
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Saudi Arabia',
  
  -- Subscription
  plan_id UUID NOT NULL REFERENCES business_subscription_plans(id),
  subscription_starts TIMESTAMP DEFAULT NOW(),
  subscription_renews TIMESTAMP,
  
  -- Billing
  stripe_customer_id VARCHAR(255),
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method_id VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP,
  verified_by UUID REFERENCES auth.users(id),
  
  -- Tracking
  total_fines_submitted INT DEFAULT 0,
  fines_this_month INT DEFAULT 0,
  extra_fines_charged INT DEFAULT 0,
  
  -- Admin
  notes TEXT,
  account_manager_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- BUSINESS EMPLOYEES (Users associated with business)
CREATE TABLE business_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Employee details
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  id_number VARCHAR(20),
  
  -- Role
  role VARCHAR(50) DEFAULT 'employee', -- 'admin', 'manager', 'employee'
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Permissions
  can_submit_fines BOOLEAN DEFAULT TRUE,
  can_view_reports BOOLEAN DEFAULT TRUE,
  can_manage_employees BOOLEAN DEFAULT FALSE,
  
  -- Tracking
  fines_submitted INT DEFAULT 0,
  fines_this_month INT DEFAULT 0,
  
  added_at TIMESTAMP DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  
  UNIQUE(business_id, user_id)
);

-- BUSINESS FINE SUBMISSIONS (Track usage)
CREATE TABLE business_fine_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_accounts(id),
  case_id UUID REFERENCES cases(id),
  
  -- Employee who submitted
  employee_id UUID REFERENCES business_employees(id),
  
  -- Fine details
  fine_type_id UUID REFERENCES fine_types(id),
  fine_amount INT,
  
  -- Billing
  included_in_plan BOOLEAN DEFAULT TRUE, -- TRUE = counted toward monthly limit
  extra_charge INT DEFAULT 0, -- if went over limit
  
  -- Status
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, approved, paid, cancelled
  
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- BUSINESS BILLING HISTORY
CREATE TABLE business_billing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_accounts(id),
  
  -- Invoice details
  invoice_number VARCHAR(50) UNIQUE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  
  -- Charges
  plan_fee INT NOT NULL,
  setup_fee INT DEFAULT 0,
  extra_fines_count INT DEFAULT 0,
  extra_fines_cost INT DEFAULT 0,
  
  -- Totals
  subtotal INT NOT NULL,
  tax INT DEFAULT 0,
  total INT NOT NULL,
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_date TIMESTAMP,
  stripe_charge_id VARCHAR(255),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

-- BUSINESS USAGE TRACKING (Real-time)
CREATE TABLE business_monthly_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_accounts(id),
  
  -- Period
  year INT NOT NULL,
  month INT NOT NULL,
  
  -- Usage
  fines_submitted INT DEFAULT 0,
  fines_included INT DEFAULT 0,
  fines_extra INT DEFAULT 0,
  
  -- Costs
  plan_fee INT,
  extra_fine_cost INT DEFAULT 0,
  
  -- Status
  is_finalized BOOLEAN DEFAULT FALSE,
  finalized_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(business_id, year, month)
);

-- BUSINESS NOTIFICATIONS & ALERTS
CREATE TABLE business_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business_accounts(id),
  
  -- Notification
  type VARCHAR(50), -- 'limit_warning', 'limit_exceeded', 'payment_failed', 'renewal_reminder'
  title VARCHAR(255),
  message TEXT,
  
  -- Tracking
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA: SUBSCRIPTION PLANS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO business_subscription_plans 
  (name, slug, description, monthly_price, setup_fee, max_fines_per_month, max_employees, features, display_order, is_active)
VALUES
  ('Starter', 'starter', 'Perfect for small fleets and startups', 500, 0, 20, 5, 
   '{"reporting": false, "priority_support": false, "api_access": false, "custom_negotiation": false}'::jsonb, 1, TRUE),
  
  ('Professional', 'professional', 'For growing businesses and fleets', 1500, 500, 50, 20,
   '{"reporting": true, "priority_support": true, "api_access": false, "custom_negotiation": true}'::jsonb, 2, TRUE),
  
  ('Enterprise', 'enterprise', 'For large corporations with unlimited needs', 5000, 2000, NULL, NULL,
   '{"reporting": true, "priority_support": true, "api_access": true, "custom_negotiation": true, "dedicated_manager": true}'::jsonb, 3, TRUE);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_business_accounts_stripe_id ON business_accounts(stripe_customer_id);
CREATE INDEX idx_business_accounts_active ON business_accounts(is_active);
CREATE INDEX idx_business_accounts_verified ON business_accounts(is_verified);
CREATE INDEX idx_business_employees_business_id ON business_employees(business_id);
CREATE INDEX idx_business_fine_submissions_business_id ON business_fine_submissions(business_id);
CREATE INDEX idx_business_fine_submissions_created ON business_fine_submissions(created_at);
CREATE INDEX idx_business_monthly_usage_period ON business_monthly_usage(business_id, year, month);
CREATE INDEX idx_business_billing_history_business_id ON business_billing_history(business_id);
CREATE INDEX idx_business_billing_history_status ON business_billing_history(payment_status);
CREATE INDEX idx_business_notifications_business_id ON business_notifications(business_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_fine_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_monthly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for business_accounts
CREATE POLICY "Business can view own account"
  ON business_accounts
  FOR SELECT
  USING (
    id IN (
      SELECT business_id FROM business_employees 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR account_manager_id = auth.uid()
  );

CREATE POLICY "Business admin can update own account"
  ON business_accounts
  FOR UPDATE
  USING (
    id IN (
      SELECT business_id FROM business_employees 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for business_employees
CREATE POLICY "Employees can view their business employees"
  ON business_employees
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_employees 
      WHERE user_id = auth.uid()
    )
  );

-- Policies for business_fine_submissions
CREATE POLICY "Employees can view their submissions"
  ON business_fine_submissions
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_employees 
      WHERE user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check if business is within monthly limits
CREATE OR REPLACE FUNCTION check_business_fine_limit(
  p_business_id UUID,
  p_month INT,
  p_year INT
) RETURNS TABLE (
  can_submit BOOLEAN,
  fines_used INT,
  fines_limit INT,
  message VARCHAR
) AS $$
DECLARE
  v_plan_id UUID;
  v_fines_submitted INT;
  v_fines_limit INT;
  v_can_submit BOOLEAN;
BEGIN
  -- Get business plan
  SELECT plan_id INTO v_plan_id FROM business_accounts WHERE id = p_business_id;
  
  -- Get plan limits
  SELECT max_fines_per_month INTO v_fines_limit FROM business_subscription_plans WHERE id = v_plan_id;
  
  -- Get current month usage
  SELECT COALESCE(fines_submitted, 0) INTO v_fines_submitted 
  FROM business_monthly_usage 
  WHERE business_id = p_business_id AND year = p_year AND month = p_month;
  
  -- Check if unlimited
  IF v_fines_limit IS NULL THEN
    v_can_submit := TRUE;
  ELSE
    v_can_submit := v_fines_submitted < v_fines_limit;
  END IF;
  
  RETURN QUERY SELECT 
    v_can_submit,
    v_fines_submitted,
    v_fines_limit,
    CASE 
      WHEN v_fines_limit IS NULL THEN 'Unlimited fines'
      WHEN v_can_submit THEN 'Within limit'
      ELSE 'Limit exceeded - extra charges will apply'
    END;
END;
$$ LANGUAGE plpgsql;

-- Auto-charge for extra fines
CREATE OR REPLACE FUNCTION charge_extra_fine(
  p_business_id UUID,
  p_month INT,
  p_year INT
) RETURNS INT AS $$
DECLARE
  v_extra_charge INT := 50; -- 50 SAR per extra fine
BEGIN
  -- Increment extra fines count and calculate charge
  UPDATE business_monthly_usage
  SET 
    fines_extra = fines_extra + 1,
    extra_fine_cost = (fines_extra + 1) * v_extra_charge
  WHERE business_id = p_business_id AND year = p_year AND month = p_month;
  
  RETURN v_extra_charge;
END;
$$ LANGUAGE plpgsql;
