require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('./database');
const logger = require('./logger');

const schema = `
-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ENUM Types ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'field_executive', 'hospital_reception', 'field_manager');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE card_status AS ENUM ('active', 'inactive', 'expired', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('welcome', 'service_used', 'card_expiry', 'renewal', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('email', 'whatsapp', 'sms');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'delivered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Users (Staff) ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'field_executive',
  hospital_id UUID,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  refresh_token TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Hospitals ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(15),
  email VARCHAR(255),
  contact_person VARCHAR(150),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add FK for users.hospital_id
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_hospital;
ALTER TABLE users ADD CONSTRAINT fk_users_hospital 
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL;

-- ─── Membership Plans ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  validity_months INTEGER NOT NULL DEFAULT 12,
  max_family_members INTEGER NOT NULL DEFAULT 4,
  benefits JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Patients ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255),
  gender gender_type,
  date_of_birth DATE,
  age INTEGER,
  address TEXT,
  area VARCHAR(150),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  id_proof_url TEXT,
  address_proof_url TEXT,
  photo_url TEXT,
  registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients USING gin(full_name gin_trgm_ops);

-- ─── Family Members ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  age INTEGER,
  gender gender_type,
  phone VARCHAR(15),
  date_of_birth DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_patient ON family_members(patient_id);

-- ─── Health Cards ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_number VARCHAR(30) UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES membership_plans(id),
  status card_status DEFAULT 'active',
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  qr_code_url TEXT,
  pdf_card_url TEXT,
  qr_code_data TEXT,
  issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_card_number ON health_cards(card_number);
CREATE INDEX IF NOT EXISTS idx_cards_patient ON health_cards(patient_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON health_cards(status);

-- ─── Card Number Sequence ─────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS card_number_seq START 1000 INCREMENT 1;

-- ─── Service Utilization ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_utilization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES health_cards(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  service_type VARCHAR(150) NOT NULL,
  service_category VARCHAR(100),
  doctor_name VARCHAR(150),
  department VARCHAR(100),
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_time TIME,
  original_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2),
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_patient ON service_utilization(patient_id);
CREATE INDEX IF NOT EXISTS idx_service_hospital ON service_utilization(hospital_id);
CREATE INDEX IF NOT EXISTS idx_service_date ON service_utilization(visit_date);

-- ─── Field Visits ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS field_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_executive_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  area VARCHAR(150),
  city VARCHAR(100),
  notes TEXT,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'visited',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_visits_exec ON field_visits(field_executive_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_date ON field_visits(visit_date);

-- ─── Notifications Log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  card_id UUID REFERENCES health_cards(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'email',
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT,
  status notification_status DEFAULT 'pending',
  sent_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Service Categories ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Updated At Trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','hospitals','membership_plans','patients','family_members','health_cards','service_utilization','field_visits','notifications'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trg_' || t || '_updated_at'
    ) THEN
      EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
    END IF;
  END LOOP;
END $$;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    logger.info('🔄 Running database migrations...');
    await client.query(schema);
    logger.info('✅ Database migration completed successfully!');
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
