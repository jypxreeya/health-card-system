const { query } = require('../config/database');
const logger = require('../config/logger');

// ─── GET /api/field/visits ────────────────────────────────────────────────────
exports.getVisits = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    const userId = req.user.id;

    const result = await query(`
      SELECT fv.*, p.full_name as patient_name, p.phone as patient_phone, hc.card_number
      FROM field_visits fv
      LEFT JOIN patients p ON fv.patient_id = p.id
      LEFT JOIN health_cards hc ON hc.patient_id = p.id
      WHERE fv.field_executive_id = $1 AND fv.visit_date = $2
      ORDER BY fv.created_at DESC
    `, [userId, date]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get field visits error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch visits' });
  }
};

// ─── POST /api/field/visits ───────────────────────────────────────────────────
exports.logVisit = async (req, res) => {
  try {
    const { area, city, notes, patient_id } = req.body;

    const result = await query(`
      INSERT INTO field_visits (field_executive_id, area, city, notes, patient_id)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [req.user.id, area, city, notes, patient_id || null]);

    res.status(201).json({ success: true, message: 'Visit logged', data: result.rows[0] });
  } catch (error) {
    logger.error('Log visit error:', error);
    res.status(500).json({ success: false, message: 'Failed to log visit' });
  }
};

// ─── GET /api/field/performance ───────────────────────────────────────────────
exports.getPerformance = async (req, res) => {
  try {
    const userId = req.user.id;

    const [thisMonth, thisWeek, allTime, recentRegistrations] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM patients WHERE registered_by = $1 AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())`, [userId]),
      query(`SELECT COUNT(*) as count FROM patients WHERE registered_by = $1 AND created_at >= NOW() - INTERVAL '7 days'`, [userId]),
      query(`SELECT COUNT(*) as count FROM patients WHERE registered_by = $1`, [userId]),
      query(`
        SELECT p.full_name, p.phone, hc.card_number, hc.created_at, mp.name as plan_name
        FROM patients p
        JOIN health_cards hc ON hc.patient_id = p.id
        JOIN membership_plans mp ON hc.plan_id = mp.id
        WHERE p.registered_by = $1
        ORDER BY p.created_at DESC LIMIT 10
      `, [userId]),
    ]);

    res.json({
      success: true,
      data: {
        this_month: parseInt(thisMonth.rows[0].count),
        this_week: parseInt(thisWeek.rows[0].count),
        all_time: parseInt(allTime.rows[0].count),
        recent_registrations: recentRegistrations.rows,
      }
    });
  } catch (error) {
    logger.error('Field performance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch performance' });
  }
};
