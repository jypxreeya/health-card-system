const { query } = require('../config/database');
const logger = require('../config/logger');

// ─── GET /api/services ────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, hospital_id = '', patient_id = '', from_date = '', to_date = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = ['1=1'];
    let params = [];
    let idx = 1;

    if (req.user.role === 'hospital_reception') {
      conditions.push(`su.hospital_id = $${idx}`); params.push(req.user.hospital_id); idx++;
    } else if (hospital_id) {
      conditions.push(`su.hospital_id = $${idx}`); params.push(hospital_id); idx++;
    }

    if (patient_id) { conditions.push(`su.patient_id = $${idx}`); params.push(patient_id); idx++; }
    if (from_date) { conditions.push(`su.visit_date >= $${idx}`); params.push(from_date); idx++; }
    if (to_date) { conditions.push(`su.visit_date <= $${idx}`); params.push(to_date); idx++; }

    const whereClause = conditions.join(' AND ');

    const [data, count] = await Promise.all([
      query(`
        SELECT su.*, p.full_name, p.phone, hc.card_number,
               h.name as hospital_name, u.name as recorded_by_name,
               fm.name as family_member_name
        FROM service_utilization su
        JOIN patients p ON su.patient_id = p.id
        JOIN health_cards hc ON su.card_id = hc.id
        JOIN hospitals h ON su.hospital_id = h.id
        LEFT JOIN users u ON su.recorded_by = u.id
        LEFT JOIN family_members fm ON su.family_member_id = fm.id
        WHERE ${whereClause}
        ORDER BY su.visit_date DESC, su.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, parseInt(limit), offset]),
      query(`SELECT COUNT(*) as total FROM service_utilization su WHERE ${whereClause}`, params),
    ]);

    res.json({
      success: true,
      data: data.rows,
      pagination: {
        total: parseInt(count.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count.rows[0].total / parseInt(limit)),
      }
    });
  } catch (error) {
    logger.error('Get services error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

// ─── POST /api/services ───────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const {
      card_number, family_member_id, service_type, service_category,
      doctor_name, department, visit_date, visit_time,
      original_amount, discount_percentage, notes
    } = req.body;

    // Lookup card by number
    const cardResult = await query(`
      SELECT hc.id as card_id, hc.patient_id, hc.status, hc.valid_until
      FROM health_cards hc
      WHERE UPPER(hc.card_number) = UPPER($1)
    `, [card_number]);

    if (!cardResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Health card not found' });
    }

    const card = cardResult.rows[0];

    if (card.status !== 'active') {
      return res.status(400).json({ success: false, message: `Card is ${card.status}. Cannot record service.` });
    }

    if (new Date(card.valid_until) < new Date()) {
      return res.status(400).json({ success: false, message: 'Health card has expired' });
    }

    const discountAmt = original_amount
      ? (parseFloat(original_amount) * parseFloat(discount_percentage || 0)) / 100
      : 0;
    const finalAmount = original_amount
      ? parseFloat(original_amount) - discountAmt
      : null;

    const result = await query(`
      INSERT INTO service_utilization
        (card_id, patient_id, family_member_id, hospital_id, service_type, service_category,
         doctor_name, department, visit_date, visit_time, original_amount, discount_percentage,
         discount_amount, final_amount, notes, recorded_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, [
      card.card_id, card.patient_id, family_member_id || null,
      req.user.hospital_id, service_type, service_category || null,
      doctor_name || null, department || null,
      visit_date || new Date().toISOString().split('T')[0],
      visit_time || null,
      original_amount || null, discount_percentage || 0,
      discountAmt, finalAmount, notes || null, req.user.id
    ]);

    res.status(201).json({
      success: true,
      message: 'Service recorded successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Create service error:', error);
    res.status(500).json({ success: false, message: 'Failed to record service' });
  }
};

// ─── GET /api/services/categories ────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const result = await query('SELECT * FROM service_categories WHERE is_active = true ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};
