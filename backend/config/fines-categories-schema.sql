-- ═══════════════════════════════════════════════════════════════════════════════
-- HIERARCHICAL FINE STRUCTURE: CATEGORY → SUBCATEGORY → FINE TYPE
-- WITH BILINGUAL SUPPORT (English/Arabic) AND UX-FRIENDLY ORGANIZATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- MAIN CATEGORIES (Traffic, Public Behaviour, Business, Environment, etc.)
CREATE TABLE fine_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Names
  name_en VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  
  -- Display
  description_en TEXT,
  description_ar TEXT,
  icon_emoji VARCHAR(10),
  color_code VARCHAR(7),
  
  -- Ordering & Status
  display_order INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SUBCATEGORIES (e.g., Traffic → Speeding, Parking, etc.)
CREATE TABLE fine_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES fine_categories(id) ON DELETE CASCADE,
  
  -- Names
  name_en VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  
  -- Details
  description_en TEXT,
  description_ar TEXT,
  
  -- Display
  display_order INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FINE TYPES (Most specific level - e.g., "Speeding 1-20 km/h")
-- Update existing fine_types table to reference subcategory
ALTER TABLE fine_types 
ADD COLUMN subcategory_id UUID REFERENCES fine_subcategories(id) ON DELETE SET NULL,
ADD COLUMN name_ar VARCHAR(100),
ADD COLUMN description_ar TEXT,
ADD COLUMN is_default BOOLEAN DEFAULT FALSE,
ADD COLUMN display_order INTEGER;

-- FINE REQUIREMENTS (Required documents, photos, etc.)
CREATE TABLE fine_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fine_type_id UUID NOT NULL REFERENCES fine_types(id) ON DELETE CASCADE,
  
  requirement_en VARCHAR(255) NOT NULL,
  requirement_ar VARCHAR(255) NOT NULL,
  
  is_mandatory BOOLEAN DEFAULT TRUE,
  requirement_type VARCHAR(50), -- 'document', 'photo', 'text', 'video'
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- FINE RESOLUTION METHODS (Court, settlement, payment plan, etc.)
CREATE TABLE fine_resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fine_type_id UUID NOT NULL REFERENCES fine_types(id) ON DELETE CASCADE,
  
  method_en VARCHAR(100) NOT NULL,
  method_ar VARCHAR(100) NOT NULL,
  
  description_en TEXT,
  description_ar TEXT,
  
  typical_timeline_days INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- FINE SEARCH INDEX (for smart search)
CREATE TABLE fine_search_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fine_type_id UUID NOT NULL REFERENCES fine_types(id) ON DELETE CASCADE,
  
  keyword_en VARCHAR(100),
  keyword_ar VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA: ALL CATEGORIES WITH SUBCATEGORIES AND FINE TYPES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. TRAFFIC & DRIVING (Main Category)
INSERT INTO fine_categories (name_en, name_ar, description_en, description_ar, icon_emoji, color_code, display_order, is_default) VALUES
('Traffic & Driving', 'المرور والقيادة', 'Fines related to driving and traffic violations', 'الغرامات المتعلقة بانتهاكات المرور والقيادة', '🚗', '#FF6B6B', 1, TRUE);

-- 2. PUBLIC BEHAVIOUR & CONDUCT
INSERT INTO fine_categories (name_en, name_ar, description_en, description_ar, icon_emoji, color_code, display_order, is_default) VALUES
('Public Behaviour', 'السلوك العام', 'Fines for public conduct, noise, and disturbance issues', 'الغرامات المتعلقة بالسلوك العام والضوضاء والإزعاج', '👥', '#4ECDC4', 2, TRUE);

-- 3. BUSINESS & COMMERCIAL
INSERT INTO fine_categories (name_en, name_ar, description_en, description_ar, icon_emoji, color_code, display_order, is_default) VALUES
('Business & Shop', 'الأعمال والمحلات', 'Fines for stores, freelancers, and small businesses', 'الغرامات للمحلات والعاملين بحسابهم والشركات الصغيرة', '🏢', '#95E1D3', 3, FALSE);

-- 4. ENVIRONMENT & PROPERTY
INSERT INTO fine_categories (name_en, name_ar, description_en, description_ar, icon_emoji, color_code, display_order, is_default) VALUES
('Environment & Property', 'البيئة والممتلكات', 'Fines for environmental or property-related violations', 'الغرامات المتعلقة بالبيئة والممتلكات', '🌿', '#90EE90', 4, FALSE);

-- 5. DIGITAL & GOVERNMENT SERVICES
INSERT INTO fine_categories (name_en, name_ar, description_en, description_ar, icon_emoji, color_code, display_order, is_default) VALUES
('Digital & Government', 'الخدمات الرقمية والحكومية', 'Fines for documentation, permits, and government services', 'الغرامات المتعلقة بالوثائق والتصاريح والخدمات الحكومية', '📄', '#FFD93D', 5, FALSE);

-- 6. LABOUR & EMPLOYMENT (B2B)
INSERT INTO fine_categories (name_en, name_ar, description_en, description_ar, icon_emoji, color_code, display_order, is_default) VALUES
('Labour & Employment', 'العمل والتوظيف', 'Fines for workplace and labour law violations', 'الغرامات المتعلقة بانتهاكات قوانين العمل', '👷', '#6C5CE7', 6, FALSE);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUBCATEGORIES (Level 2)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Traffic Subcategories
INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Speeding', 'السرعة الزائدة', 'Exceeding speed limits', 'تجاوز حدود السرعة', 1 FROM fine_categories WHERE name_en = 'Traffic & Driving' LIMIT 1;

INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Traffic Signals', 'إشارات المرور', 'Red lights and traffic signal violations', 'انتهاكات إشارات المرور والأضواء الحمراء', 2 FROM fine_categories WHERE name_en = 'Traffic & Driving' LIMIT 1;

INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Parking', 'المواقف', 'Parking and stopping violations', 'انتهاكات قوانين المواقف والتوقف', 3 FROM fine_categories WHERE name_en = 'Traffic & Driving' LIMIT 1;

INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Documents & Insurance', 'الوثائق والتأمين', 'Expired license, registration, or insurance', 'رخصة أو تسجيل أو تأمين منتهي الصلاحية', 4 FROM fine_categories WHERE name_en = 'Traffic & Driving' LIMIT 1;

INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Vehicle Safety', 'سلامة المركبة', 'Seatbelts, mirrors, equipment violations', 'حزام الأمان والمرايا وانتهاكات المعدات', 5 FROM fine_categories WHERE name_en = 'Traffic & Driving' LIMIT 1;

INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Reckless Driving', 'القيادة المتهورة', 'Dangerous or reckless driving', 'القيادة الخطرة أو المتهورة', 6 FROM fine_categories WHERE name_en = 'Traffic & Driving' LIMIT 1;

-- Public Behaviour Subcategories
INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Smoking', 'التدخين', 'Smoking in prohibited areas', 'التدخين في المناطق المحظورة', 1 FROM fine_categories WHERE name_en = 'Public Behaviour' LIMIT 1;

INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Noise & Disturbance', 'الضوضاء والإزعاج', 'Loud music or disturbance of peace', 'موسيقى عالية أو إزعاج السلام العام', 2 FROM fine_categories WHERE name_en = 'Public Behaviour' LIMIT 1;

INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Vandalism', 'التخريب', 'Damage to public property', 'الإضرار بالممتلكات العامة', 3 FROM fine_categories WHERE name_en = 'Public Behaviour' LIMIT 1;

INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Privacy & Recording', 'الخصوصية والتسجيل', 'Recording without consent or privacy violation', 'التسجيل دون موافقة أو انتهاك الخصوصية', 4 FROM fine_categories WHERE name_en = 'Public Behaviour' LIMIT 1;

-- Business Subcategories
INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Commercial Registration', 'السجل التجاري', 'CR renewal or license issues', 'مشاكل تجديد السجل التجاري أو الرخصة', 1 FROM fine_categories WHERE name_en = 'Business & Shop' LIMIT 1;

INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Consumer Protection', 'حماية المستهلك', 'Pricing or receipt violations', 'انتهاكات الأسعار أو الإيصالات', 2 FROM fine_categories WHERE name_en = 'Business & Shop' LIMIT 1;

-- Environment Subcategories
INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Littering & Waste', 'القمامة والنفايات', 'Littering or improper waste disposal', 'رمي القمامة أو التخلص غير الصحيح من النفايات', 1 FROM fine_categories WHERE name_en = 'Environment & Property' LIMIT 1;

-- Digital/Government Subcategories
INSERT INTO fine_subcategories (category_id, name_en, name_ar, description_en, description_ar, display_order) 
SELECT id, 'Permits & Renewals', 'التصاريح والتجديدات', 'Late renewals or missing permits', 'التجديدات المتأخرة أو التصاريح المفقودة', 1 FROM fine_categories WHERE name_en = 'Digital & Government' LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- UPDATE FINE_TYPES WITH NEW COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Link existing fine types to new structure
UPDATE fine_types SET 
  subcategory_id = (SELECT id FROM fine_subcategories WHERE name_en = 'Speeding' LIMIT 1),
  name_ar = 'السرعة الزائدة'
WHERE name LIKE '%peeding%';

UPDATE fine_types SET 
  subcategory_id = (SELECT id FROM fine_subcategories WHERE name_en = 'Traffic Signals' LIMIT 1),
  name_ar = 'إشارات المرور'
WHERE name LIKE '%red%light%' OR name LIKE '%signal%';

-- ═══════════════════════════════════════════════════════════════════════════════
-- REQUIREMENTS FOR COMMON FINES
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO fine_requirements (fine_type_id, requirement_en, requirement_ar, is_mandatory, requirement_type)
SELECT id, 'Upload ticket photo or citation', 'تحميل صورة المخالفة أو الإشعار', TRUE, 'photo' FROM fine_types WHERE name LIKE '%peeding%' LIMIT 1;

INSERT INTO fine_requirements (fine_type_id, requirement_en, requirement_ar, is_mandatory, requirement_type)
SELECT id, 'National ID or Driving License', 'بطاقة الهوية الوطنية أو رخصة القيادة', TRUE, 'document' FROM fine_types WHERE name LIKE '%peeding%' LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RESOLUTION METHODS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO fine_resolutions (fine_type_id, method_en, method_ar, description_en, description_ar, typical_timeline_days)
SELECT id, 'Direct Payment', 'الدفع المباشر', 'Pay fine directly without court appearance', 'دفع الغرامة مباشرة دون الحضور في المحكمة', 0 FROM fine_types WHERE name LIKE '%peeding%' LIMIT 1;

INSERT INTO fine_resolutions (fine_type_id, method_en, method_ar, description_en, description_ar, typical_timeline_days)
SELECT id, 'Court Hearing', 'جلسة المحكمة', 'Appear in court to contest the fine', 'الحضور في المحكمة للطعن في الغرامة', 30 FROM fine_types WHERE name LIKE '%peeding%' LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEARCH KEYWORDS (for smart search)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO fine_search_keywords (fine_type_id, keyword_en, keyword_ar)
SELECT id, 'speed', 'سرعة' FROM fine_types WHERE name LIKE '%peeding%' LIMIT 1;

INSERT INTO fine_search_keywords (fine_type_id, keyword_en, keyword_ar)
SELECT id, 'speeding fine', 'غرامة السرعة' FROM fine_types WHERE name LIKE '%peeding%' LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_fine_categories_active ON fine_categories(is_active);
CREATE INDEX idx_fine_categories_display_order ON fine_categories(display_order);
CREATE INDEX idx_fine_subcategories_category ON fine_subcategories(category_id);
CREATE INDEX idx_fine_types_subcategory ON fine_types(subcategory_id);
CREATE INDEX idx_fine_requirements_type ON fine_requirements(fine_type_id);
CREATE INDEX idx_fine_search_keywords_type ON fine_search_keywords(fine_type_id);
