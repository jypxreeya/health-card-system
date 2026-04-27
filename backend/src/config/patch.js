const { pool } = require('./database');
const logger = require('./logger');

async function patch() {
  const client = await pool.connect();
  try {
    logger.info('Applying database patches...');
    
    await client.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10),
      ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;
    `);

    logger.info('✅ Successfully added OTP and address columns to patients table.');
  } catch (err) {
    logger.error('Patch error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

patch();
