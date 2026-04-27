const { pool } = require('./src/config/database');
async function check() {
  const client = await pool.connect();
  try {
    // Check patients
    const patients = await client.query(`SELECT id, full_name, phone, email, otp_code, otp_expires_at FROM patients LIMIT 5`);
    console.log('=== PATIENTS ===');
    console.table(patients.rows);
    
    // Check health cards
    const cards = await client.query(`SELECT hc.card_number, hc.status, hc.patient_id, p.phone, p.full_name FROM health_cards hc JOIN patients p ON hc.patient_id = p.id LIMIT 5`);
    console.log('\n=== HEALTH CARDS ===');
    console.table(cards.rows);
  } finally {
    client.release();
    pool.end();
  }
}
check();
