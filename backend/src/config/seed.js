require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { pool } = require('./database');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

async function seed() {
  const client = await pool.connect();
  try {
    logger.info('🌱 Seeding database with initial data...');

    // ── Super Admin ────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await client.query(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Super Admin', 'superadmin@nammahealth.com', '9999999999', passwordHash, 'super_admin']);
    logger.info('✅ Super admin created → superadmin@nammahealth.com / Admin@123');

    // ── Demo Hospital ──────────────────────────────────────────────────────────
    const hospitalResult = await client.query(`
      INSERT INTO hospitals (name, code, address, city, state, pincode, phone, email, contact_person)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [
      'Namma Health Demo Hospital', 'NHH-001',
      '123, Anna Salai, T. Nagar', 'Chennai', 'Tamil Nadu', '600017',
      '9876543210', 'demo@nammahealth.com', 'Dr. Ramesh Kumar'
    ]);
    const hospitalId = hospitalResult.rows[0].id;
    logger.info(`✅ Demo hospital created: ${hospitalId}`);

    // ── Hospital Reception Login ───────────────────────────────────────────────
    const receptionHash = await bcrypt.hash('Reception@123', 12);
    await client.query(`
      INSERT INTO users (name, email, phone, password_hash, role, hospital_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, ['Reception Desk 1', 'reception@nammahealth.com', '9876543211', receptionHash, 'hospital_reception', hospitalId]);
    logger.info('✅ Reception user created → reception@nammahealth.com / Reception@123');

    // ── Field Executive ────────────────────────────────────────────────────────
    const fieldHash = await bcrypt.hash('Field@123', 12);
    await client.query(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Raveen Kumar (Field Exec)', 'field@nammahealth.com', '9876543212', fieldHash, 'field_executive']);
    logger.info('✅ Field executive created → field@nammahealth.com / Field@123');

    // ── Membership Plans ───────────────────────────────────────────────────────
    const plans = [
      {
        name: 'Basic Health Card',
        code: 'BASIC',
        description: 'Essential health coverage for individuals',
        price: 499,
        validity_months: 12,
        max_family_members: 1,
        benefits: JSON.stringify([
          'Free OPD Consultation (up to 3 visits/year)',
          '10% Discount on Diagnostics',
          '5% Discount on Pharmacy',
          'Emergency Helpline Access'
        ])
      },
      {
        name: 'Family Health Card',
        code: 'FAMILY',
        description: 'Comprehensive coverage for the entire family (up to 4 members)',
        price: 1299,
        validity_months: 12,
        max_family_members: 4,
        benefits: JSON.stringify([
          'Free OPD Consultation (up to 10 visits/year)',
          '20% Discount on Diagnostics',
          '10% Discount on Pharmacy',
          '5% Discount on Hospitalization',
          'Free Annual Health Checkup',
          'Emergency Helpline Access',
          'Priority Appointment Booking'
        ])
      },
      {
        name: 'Premium Health Card',
        code: 'PREMIUM',
        description: 'Premium all-inclusive coverage for large families (up to 6 members)',
        price: 2499,
        validity_months: 12,
        max_family_members: 6,
        benefits: JSON.stringify([
          'Unlimited Free OPD Consultations',
          '30% Discount on Diagnostics',
          '15% Discount on Pharmacy',
          '10% Discount on Hospitalization',
          'Free Comprehensive Annual Health Checkup',
          'Free Dental Checkup (1/year)',
          '24/7 Doctor Helpline',
          'Priority Appointment Booking',
          'Home Sample Collection (2/year)',
          'Ambulance Assistance'
        ])
      }
    ];

    for (const plan of plans) {
      await client.query(`
        INSERT INTO membership_plans (name, code, description, price, validity_months, max_family_members, benefits)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, benefits = EXCLUDED.benefits
      `, [plan.name, plan.code, plan.description, plan.price, plan.validity_months, plan.max_family_members, plan.benefits]);
    }
    logger.info('✅ 3 membership plans created (Basic / Family / Premium)');

    // ── Service Categories ─────────────────────────────────────────────────────
    const categories = [
      'OPD Consultation', 'Diagnostics & Lab', 'Radiology',
      'Pharmacy', 'Hospitalization', 'Surgery', 'Dental',
      'Physiotherapy', 'Emergency', 'Health Checkup', 'Ophthalmology', 'Other'
    ];

    for (const cat of categories) {
      await client.query(`
        INSERT INTO service_categories (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING
      `, [cat]);
    }
    logger.info(`✅ ${categories.length} service categories created`);

    // ── Demo Patient ───────────────────────────────────────────────────────────
    const fieldUser = await client.query(`SELECT id FROM users WHERE email = 'field@nammahealth.com'`);
    const fieldExecId = fieldUser.rows[0]?.id;

    const patientResult = await client.query(`
      INSERT INTO patients (full_name, phone, email, gender, age, address, area, city, state, pincode, registered_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id
    `, [
      'Suresh Babu', '9500012345', 'suresh@example.com',
      'male', 35, '45, Gandhi Street', 'Adyar', 'Chennai', 'Tamil Nadu', '600020',
      fieldExecId
    ]);
    const patientId = patientResult.rows[0].id;

    // Demo family member
    await client.query(`
      INSERT INTO family_members (patient_id, name, relationship, age, gender)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
    `, [patientId, 'Kavitha Suresh', 'Spouse', 30, 'female']);

    // Demo health card
    const planResult = await client.query(`SELECT id FROM membership_plans WHERE code = 'FAMILY'`);
    const planId = planResult.rows[0].id;
    const cardNum = `NHC-${new Date().getFullYear()}-${String(nextval('card_number_seq')).padStart(5, '0')}`;

    await client.query(`
      INSERT INTO health_cards (card_number, patient_id, plan_id, valid_until, issued_by, hospital_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (card_number) DO NOTHING
    `, [
      'NHC-2026-01000', patientId, planId,
      new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      fieldExecId, hospitalId
    ]);
    logger.info(`✅ Demo patient & health card created: Suresh Babu → NHC-2026-01000`);

    logger.info('');
    logger.info('🎉 Database seeding completed!');
    logger.info('─────────────────────────────────────────');
    logger.info('📧 Login Credentials:');
    logger.info('   Super Admin  → superadmin@nammahealth.com / Admin@123');
    logger.info('   Reception    → reception@nammahealth.com  / Reception@123');
    logger.info('   Field Exec   → field@nammahealth.com      / Field@123');
    logger.info('─────────────────────────────────────────');
  } catch (error) {
    logger.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Helper (since we can't use SQL nextval directly in JS)
let seq = 1000;
function nextval() { return ++seq; }

seed().catch(() => process.exit(1));
