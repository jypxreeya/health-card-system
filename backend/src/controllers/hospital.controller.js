const { query } = require('../config/database');
const logger = require('../config/logger');

// ─── GET /api/hospitals ───────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const result = await query(`
      SELECT h.*,
        (SELECT COUNT(*) FROM users u WHERE u.hospital_id = h.id AND u.is_active = true) as staff_count,
        (SELECT COUNT(*) FROM health_cards hc WHERE hc.hospital_id = h.id) as total_cards,
        (SELECT COUNT(*) FROM service_utilization su WHERE su.hospital_id = h.id) as total_services
      FROM hospitals h
      ORDER BY h.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get hospitals error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hospitals' });
  }
};

// ─── GET /api/hospitals/:id ───────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [hospital, staff, recentServices] = await Promise.all([
      query('SELECT * FROM hospitals WHERE id = $1', [id]),
      query(`SELECT id, name, email, phone, role, is_active FROM users WHERE hospital_id = $1`, [id]),
      query(`
        SELECT su.*, p.full_name, p.phone, hc.card_number
        FROM service_utilization su
        JOIN patients p ON su.patient_id = p.id
        JOIN health_cards hc ON su.card_id = hc.id
        WHERE su.hospital_id = $1
        ORDER BY su.created_at DESC LIMIT 10
      `, [id]),
    ]);

    if (!hospital.rows.length) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    res.json({
      success: true,
      data: { ...hospital.rows[0], staff: staff.rows, recent_services: recentServices.rows }
    });
  } catch (error) {
    logger.error('Get hospital error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hospital' });
  }
};

// ─── POST /api/hospitals ──────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name, code, address, city, state, pincode, phone, email, contact_person } = req.body;

    const result = await query(`
      INSERT INTO hospitals (name, code, address, city, state, pincode, phone, email, contact_person)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [name, code.toUpperCase(), address, city, state, pincode, phone, email, contact_person]);

    res.status(201).json({ success: true, message: 'Hospital created', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Hospital code already exists' });
    }
    logger.error('Create hospital error:', error);
    res.status(500).json({ success: false, message: 'Failed to create hospital' });
  }
};

// ─── PUT /api/hospitals/:id ───────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, state, pincode, phone, email, contact_person, is_active } = req.body;

    const result = await query(`
      UPDATE hospitals SET name=$1, address=$2, city=$3, state=$4, pincode=$5,
        phone=$6, email=$7, contact_person=$8, is_active=$9
      WHERE id = $10 RETURNING *
    `, [name, address, city, state, pincode, phone, email, contact_person, is_active, id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    res.json({ success: true, message: 'Hospital updated', data: result.rows[0] });
  } catch (error) {
    logger.error('Update hospital error:', error);
    res.status(500).json({ success: false, message: 'Failed to update hospital' });
  }
};
