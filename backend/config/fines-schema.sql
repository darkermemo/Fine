-- ══════════════════════════════════════════════════════════════════════════════
-- FINES MANAGEMENT SYSTEM - MULTI-TYPE SUPPORT WITH ADMIN CONTROLS
-- ══════════════════════════════════════════════════════════════════════════════

-- FINE TYPES (Traffic, Commercial, Municipal, Parking, etc.)
CREATE TABLE fine_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'traffic', 'commercial', 'municipal', 'parking', 'other'
  icon_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FEE STRUCTURES (What fees apply to each fine type)
CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fine_type_id UUID NOT NULL REFERENCES fine_types(id) ON DELETE CASCADE,
  
  -- Base structure
  base_fine_amount DECIMAL(10, 2),
  min_fine DECIMAL(10, 2),
  max_fine DECIMAL(10, 2),
  
  -- Additional fees
  admin_fee DECIMAL(10, 2), -- Fixed fee for admin/court
  penalty_fee_percentage DECIMAL(5, 2), -- Additional fee as percentage
  late_payment_fee DECIMAL(10, 2), -- Fee for late payment
  
  -- Platform cuts
  platform_commission_percentage DECIMAL(5, 2) DEFAULT 10, -- Platform's cut
  lawyer_commission_percentage DECIMAL(5, 2) DEFAULT 90, -- Lawyer's cut
  
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ADMIN PLATFORM SETTINGS
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(50), -- 'percentage', 'amount', 'boolean', 'text', 'json'
  description TEXT,
  category VARCHAR(50), -- 'payment', 'commission', 'fine', 'general'
  is_editable BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PAYMENT SETTINGS
CREATE TABLE payment_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_name VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'stripe', 'payment_methods', 'security'
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PAYMENT METHODS (Credit card, Bank transfer, Digital wallet, etc.)
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(50), -- 'card', 'bank_transfer', 'paypal', 'apple_pay'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  requires_authentication BOOLEAN DEFAULT FALSE,
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- USER-SUBMITTED FINES (Cases extended to support multiple fine types)
-- Update: Add fine_type_id to cases table reference
ALTER TABLE cases 
ADD COLUMN fine_type_id UUID REFERENCES fine_types(id) ON DELETE SET NULL,
ADD COLUMN fine_category VARCHAR(50),
ADD COLUMN fine_description TEXT,
ADD COLUMN admin_fee DECIMAL(10, 2),
ADD COLUMN penalty_fee_percentage DECIMAL(5, 2),
ADD COLUMN late_payment_fee DECIMAL(10, 2);

-- FEE BREAKDOWN (Track all fees applied to a payment)
CREATE TABLE fee_breakdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  
  -- Original fine
  base_fine_amount DECIMAL(10, 2),
  
  -- All fees
  admin_fee DECIMAL(10, 2),
  penalty_fee DECIMAL(10, 2),
  late_payment_fee DECIMAL(10, 2),
  court_fee DECIMAL(10, 2),
  
  -- Total before commission split
  total_before_commission DECIMAL(10, 2),
  
  -- Commission split
  platform_commission DECIMAL(10, 2),
  lawyer_commission DECIMAL(10, 2),
  
  -- Total after commission
  total_after_commission DECIMAL(10, 2),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- FINE VIOLATIONS REFERENCE (For each fine type, specific violations)
CREATE TABLE fine_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fine_type_id UUID NOT NULL REFERENCES fine_types(id) ON DELETE CASCADE,
  violation_name VARCHAR(255) NOT NULL,
  violation_code VARCHAR(50),
  description TEXT,
  default_fine_amount DECIMAL(10, 2),
  severity_level VARCHAR(50), -- 'minor', 'moderate', 'severe'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT LOG FOR SETTINGS CHANGES
CREATE TABLE settings_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id),
  action VARCHAR(100),
  entity_type VARCHAR(50), -- 'fine_type', 'fee_structure', 'setting', 'payment_method'
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INITIAL DATA: SAUDI FINES EXAMPLE + COMMERCIAL + OTHER TYPES
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO fine_types (name, description, category, is_active) VALUES
('Traffic Violation', 'Speed, red light, parking violations', 'traffic', TRUE),
('Commercial License', 'Business registration, license violations', 'commercial', TRUE),
('Municipal Violation', 'Building code, sanitation violations', 'municipal', TRUE),
('Parking Violation', 'Illegal parking, meter violations', 'parking', TRUE),
('Environmental', 'Pollution, waste disposal violations', 'environmental', TRUE),
('Labor Violation', 'Employment law violations', 'labor', TRUE);

-- Saudi Traffic Fine Examples
INSERT INTO fine_violations (fine_type_id, violation_name, violation_code, description, default_fine_amount, severity_level) 
SELECT id, 'Speeding (1-20 km/h over limit)', 'SA-SPEED-1', 'Minor speeding violation', 300.00, 'minor' 
FROM fine_types WHERE name = 'Traffic Violation' LIMIT 1;

INSERT INTO fine_violations (fine_type_id, violation_name, violation_code, description, default_fine_amount, severity_level) 
SELECT id, 'Speeding (20+ km/h over limit)', 'SA-SPEED-2', 'Severe speeding violation', 800.00, 'severe' 
FROM fine_types WHERE name = 'Traffic Violation' LIMIT 1;

INSERT INTO fine_violations (fine_type_id, violation_name, violation_code, description, default_fine_amount, severity_level) 
SELECT id, 'Running red light', 'SA-RED-LIGHT', 'Traffic signal violation', 500.00, 'moderate' 
FROM fine_types WHERE name = 'Traffic Violation' LIMIT 1;

INSERT INTO fine_violations (fine_type_id, violation_name, violation_code, description, default_fine_amount, severity_level) 
SELECT id, 'Driving without license', 'SA-NO-LICENSE', 'No valid driving license', 2000.00, 'severe' 
FROM fine_types WHERE name = 'Traffic Violation' LIMIT 1;

INSERT INTO fine_violations (fine_type_id, violation_name, violation_code, description, default_fine_amount, severity_level) 
SELECT id, 'No insurance', 'SA-NO-INSURE', 'Vehicle not insured', 1000.00, 'severe' 
FROM fine_types WHERE name = 'Traffic Violation' LIMIT 1;

-- Fee Structures for each type
INSERT INTO fee_structures (fine_type_id, min_fine, max_fine, admin_fee, penalty_fee_percentage, late_payment_fee, platform_commission_percentage, lawyer_commission_percentage)
SELECT id, 200.00, 5000.00, 50.00, 10.00, 100.00, 10.00, 90.00
FROM fine_types WHERE name = 'Traffic Violation' LIMIT 1;

INSERT INTO fee_structures (fine_type_id, min_fine, max_fine, admin_fee, penalty_fee_percentage, late_payment_fee, platform_commission_percentage, lawyer_commission_percentage)
SELECT id, 500.00, 10000.00, 100.00, 15.00, 200.00, 10.00, 90.00
FROM fine_types WHERE name = 'Commercial License' LIMIT 1;

INSERT INTO fee_structures (fine_type_id, min_fine, max_fine, admin_fee, penalty_fee_percentage, late_payment_fee, platform_commission_percentage, lawyer_commission_percentage)
SELECT id, 300.00, 8000.00, 75.00, 12.00, 150.00, 10.00, 90.00
FROM fine_types WHERE name = 'Municipal Violation' LIMIT 1;

-- Payment Methods
INSERT INTO payment_methods (name, code, description, is_active) VALUES
('Credit Card', 'card', 'Visa, Mastercard, American Express', TRUE),
('Debit Card', 'debit_card', 'Direct debit card payment', TRUE),
('Bank Transfer', 'bank_transfer', 'Direct bank account transfer', TRUE),
('Digital Wallet', 'digital_wallet', 'Apple Pay, Google Pay, Samsung Pay', TRUE),
('PayPal', 'paypal', 'PayPal account payment', TRUE),
('Local Payment Gateway', 'local_gateway', 'Saudi payment gateway (e.g., HyperPay, PayFort)', TRUE);

-- Admin Settings (Editable by admin)
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description, category, is_editable) VALUES
('platform_commission_default', '10', 'percentage', 'Default platform commission percentage', 'commission', TRUE),
('lawyer_commission_default', '90', 'percentage', 'Default lawyer commission percentage', 'commission', TRUE),
('enable_late_fees', 'true', 'boolean', 'Enable late payment fees', 'fine', TRUE),
('max_payment_attempts', '3', 'text', 'Maximum payment retry attempts', 'payment', TRUE),
('payment_timeout_minutes', '15', 'text', 'Payment session timeout in minutes', 'payment', TRUE),
('currency', 'SAR', 'text', 'Platform currency', 'general', FALSE);

-- INDEXES
CREATE INDEX idx_fine_types_category ON fine_types(category);
CREATE INDEX idx_fine_types_active ON fine_types(is_active);
CREATE INDEX idx_fee_structures_fine_type ON fee_structures(fine_type_id);
CREATE INDEX idx_cases_fine_type ON cases(fine_type_id);
CREATE INDEX idx_fine_violations_fine_type ON fine_violations(fine_type_id);
CREATE INDEX idx_settings_audit_created ON settings_audit_log(created_at);
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);
