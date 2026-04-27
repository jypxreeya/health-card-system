const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

// ─── GET /api/admin/users ──────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.last_login, u.created_at,
             h.name as hospital_name
      FROM users u
      LEFT JOIN hospitals h ON u.hospital_id = h.id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// ─── POST /api/admin/users ────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, hospital_id } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(`
      INSERT INTO users (name, email, phone, password_hash, role, hospital_id)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, phone, role, is_active, created_at
    `, [name, email.toLowerCase(), phone, hash, role, hospital_id || null]);

    res.status(201).json({ success: true, message: 'User created', data: result.rows[0] });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

// ─── PUT /api/admin/users/:id ──────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, hospital_id, is_active } = req.body;

    const result = await query(`
      UPDATE users SET name=$1, phone=$2, role=$3, hospital_id=$4, is_active=$5
      WHERE id = $6 RETURNING id, name, email, phone, role, is_active
    `, [name, phone, role, hospital_id || null, is_active, id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User updated', data: result.rows[0] });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// ─── PUT /api/admin/users/:id/reset-password ──────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, refresh_token = NULL WHERE id = $2', [hash, id]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// ─── GET /api/admin/reports/registrations ─────────────────────────────────────
exports.getRegistrationReport = async (req, res) => {
  try {
    const { from_date, to_date, hospital_id, plan_id } = req.query;

    let conditions = ['1=1'];
    let params = [];
    let idx = 1;

    if (from_date) { conditions.push(`p.created_at >= $${idx}`); params.push(from_date); idx++; }
    if (to_date) { conditions.push(`p.created_at <= $${idx}`); params.push(to_date + ' 23:59:59'); idx++; }
    if (hospital_id) { conditions.push(`hc.hospital_id = $${idx}`); params.push(hospital_id); idx++; }
    if (plan_id) { conditions.push(`hc.plan_id = $${idx}`); params.push(plan_id); idx++; }

    const result = await query(`
      SELECT p.id, p.full_name, p.phone, p.email, p.gender, p.age, p.area, p.city,
             p.created_at as registration_date,
             hc.card_number, hc.status as card_status, hc.valid_until,
             mp.name as plan_name, mp.price as plan_price,
             h.name as hospital_name, u.name as registered_by
      FROM patients p
      LEFT JOIN health_cards hc ON hc.patient_id = p.id
      LEFT JOIN membership_plans mp ON hc.plan_id = mp.id
      LEFT JOIN hospitals h ON hc.hospital_id = h.id
      LEFT JOIN users u ON p.registered_by = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
    `, params);

    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (error) {
    logger.error('Registration report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

// ─── GET /api/admin/reports/services ──────────────────────────────────────────
exports.getServiceReport = async (req, res) => {
  try {
    const { from_date, to_date, hospital_id } = req.query;

    let conditions = ['1=1'];
    let params = [];
    let idx = 1;

    if (from_date) { conditions.push(`su.visit_date >= $${idx}`); params.push(from_date); idx++; }
    if (to_date) { conditions.push(`su.visit_date <= $${idx}`); params.push(to_date); idx++; }
    if (hospital_id) { conditions.push(`su.hospital_id = $${idx}`); params.push(hospital_id); idx++; }

    const result = await query(`
      SELECT su.id, su.visit_date, su.service_type, su.service_category,
             su.original_amount, su.discount_amount, su.final_amount, su.discount_percentage,
             su.doctor_name, su.department, su.notes,
             p.full_name, p.phone, hc.card_number,
             h.name as hospital_name, u.name as recorded_by,
             fm.name as family_member_name
      FROM service_utilization su
      JOIN patients p ON su.patient_id = p.id
      JOIN health_cards hc ON su.card_id = hc.id
      JOIN hospitals h ON su.hospital_id = h.id
      LEFT JOIN users u ON su.recorded_by = u.id
      LEFT JOIN family_members fm ON su.family_member_id = fm.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY su.visit_date DESC
    `, params);

    const summary = {
      total_services: result.rows.length,
      total_original: result.rows.reduce((s, r) => s + (parseFloat(r.original_amount) || 0), 0),
      total_discount: result.rows.reduce((s, r) => s + (parseFloat(r.discount_amount) || 0), 0),
      total_final: result.rows.reduce((s, r) => s + (parseFloat(r.final_amount) || 0), 0),
    };

    res.json({ success: true, data: result.rows, summary });
  } catch (error) {
    logger.error('Service report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};
