-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES (RBAC)
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('user', 'Regular user who can create cases and hire lawyers', '["create_case", "view_case", "hire_lawyer", "make_payment"]'),
('lawyer', 'Attorney who can accept cases and communicate with clients', '["accept_case", "view_case", "communicate", "submit_outcome", "request_payout"]'),
('admin', 'Platform administrator with full access', '["manage_users", "manage_cases", "manage_payments", "view_analytics", "manage_support"]'),
('technical_support', 'Technical support team member', '["view_users", "view_cases", "resolve_issues", "manage_tickets"]'),
('business_support', 'Business/operations support team member', '["view_analytics", "manage_invoices", "process_payments", "generate_reports"]');

-- PROFILES (User extended information)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  profile_image_url TEXT,
  bio TEXT,
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_zip_code VARCHAR(10),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- LAWYER PROFILES
CREATE TABLE lawyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  specializations VARCHAR(255)[],
  bar_license_number VARCHAR(50),
  bar_license_state VARCHAR(50),
  years_of_experience INTEGER,
  hourly_rate DECIMAL(10, 2),
  bio_long TEXT,
  verification_documents JSONB,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_cases INTEGER DEFAULT 0,
  successful_cases INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(3, 2),
  response_time_hours INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CASES
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES lawyer_profiles(id) ON DELETE SET NULL,
  
  -- Ticket Details
  violation_type VARCHAR(100) NOT NULL,
  ticket_number VARCHAR(50),
  issue_date DATE NOT NULL,
  violation_location VARCHAR(255),
  violation_city VARCHAR(100),
  violation_state VARCHAR(50),
  violation_county VARCHAR(100),
  
  -- Court Info
  court_name VARCHAR(255) NOT NULL,
  court_address VARCHAR(255),
  court_phone VARCHAR(20),
  
  -- Officer Info
  officer_name VARCHAR(100),
  officer_badge_number VARCHAR(50),
  
  -- Speed Details (if applicable)
  actual_speed INTEGER,
  speed_limit INTEGER,
  speed_zone VARCHAR(100),
  
  -- Fine Details
  fine_amount DECIMAL(10, 2) NOT NULL,
  demerit_points INTEGER,
  ticket_image_url TEXT,
  
  -- Client Info
  is_cdl_driver BOOLEAN DEFAULT FALSE,
  license_number VARCHAR(50),
  license_state VARCHAR(50),
  
  -- Status & Dates
  status VARCHAR(50) DEFAULT 'pending',
  court_date DATE,
  
  -- Outcome
  outcome_type VARCHAR(50),
  final_fine DECIMAL(10, 2),
  final_points INTEGER,
  outcome_notes TEXT,
  outcome_document_url TEXT,
  
  -- Pricing & Payment
  quoted_price DECIMAL(10, 2) NOT NULL,
  actual_price DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2),
  refund_amount DECIMAL(10, 2),
  
  payment_status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP,
  
  -- Client Rating
  client_rating INTEGER,
  client_review TEXT,
  rated_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CASE DOCUMENTS
CREATE TABLE case_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100),
  document_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- CASE NOTES
CREATE TABLE case_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CASE TIMELINE
CREATE TABLE case_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  note TEXT,
  updated_by UUID REFERENCES profiles(id),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- MESSAGES (Real-time communication)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES lawyer_profiles(id) ON DELETE SET NULL,
  
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  
  payment_method VARCHAR(50),
  card_last_4 VARCHAR(4),
  card_brand VARCHAR(50),
  
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  stripe_refund_id VARCHAR(255),
  
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- INVOICES
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES lawyer_profiles(id) ON DELETE SET NULL,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'draft',
  
  -- Line Items
  line_items JSONB NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  tax_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  paid_at TIMESTAMP,
  payment_method VARCHAR(50),
  
  -- Notes
  notes TEXT,
  terms TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TRANSACTIONS (Financial tracking)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  
  from_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Transaction Details
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Platform Fee Breakdown
  gross_amount DECIMAL(10, 2),
  platform_fee DECIMAL(10, 2),
  platform_fee_percentage DECIMAL(5, 2),
  net_amount DECIMAL(10, 2),
  
  -- Lawyer Payout (for case payments)
  lawyer_payout_amount DECIMAL(10, 2),
  lawyer_payout_status VARCHAR(50),
  lawyer_paid_at TIMESTAMP,
  
  description TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- REFUNDS
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refund_id VARCHAR(100) UNIQUE NOT NULL,
  
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  
  reason VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  approved_by UUID REFERENCES profiles(id),
  
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  plan_type VARCHAR(50) DEFAULT 'free',
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  
  cases_per_month INTEGER DEFAULT 5,
  cases_used INTEGER DEFAULT 0,
  quota_reset_date DATE,
  
  price DECIMAL(10, 2),
  auto_renew BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- DASHBOARDS / ANALYTICS
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- For Analytics dashboard (NULL if user_id is null means platform-wide)
  metric_type VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15, 2),
  
  -- Metadata
  date_recorded DATE DEFAULT CURRENT_DATE,
  period VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'yearly'
  
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- SUPPORT TICKETS
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT LOG
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES for Performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_lawyer_profiles_profile_id ON lawyer_profiles(profile_id);
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_lawyer_id ON cases(lawyer_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created_at ON cases(created_at);
CREATE INDEX idx_messages_case_id ON messages(case_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_case_id ON payments(case_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_transactions_from_profile_id ON transactions(from_profile_id);
CREATE INDEX idx_transactions_to_profile_id ON transactions(to_profile_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_by ON support_tickets(created_by);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Row Level Security (RLS) - Enable for tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Cases: Users can see their own cases
CREATE POLICY "Users can view own cases" ON cases
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT profile_id FROM lawyer_profiles WHERE id = lawyer_id)
  );

-- Messages: Users in a case can see messages
CREATE POLICY "Users can view case messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Payments: Users can see their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (lawyer_id IS NOT NULL AND auth.uid() IN (SELECT profile_id FROM lawyer_profiles WHERE id = lawyer_id))
  );
