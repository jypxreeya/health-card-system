const { query } = require('../config/database');
const logger = require('../config/logger');

// ─── GET /api/plans ───────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const result = await query(`
      SELECT mp.*,
        (SELECT COUNT(*) FROM health_cards hc WHERE hc.plan_id = mp.id AND hc.status = 'active') as active_cards
      FROM membership_plans mp
      ORDER BY mp.price ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
};

// ─── GET /api/plans/:id ───────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const result = await query('SELECT * FROM membership_plans WHERE id = $1', [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Get plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plan' });
  }
};

// ─── POST /api/plans ──────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name, code, description, price, validity_months, max_family_members, benefits } = req.body;

    const result = await query(`
      INSERT INTO membership_plans (name, code, description, price, validity_months, max_family_members, benefits)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [name, code.toUpperCase(), description, price, validity_months, max_family_members, JSON.stringify(benefits || [])]);

    res.status(201).json({ success: true, message: 'Plan created', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Plan code already exists' });
    }
    logger.error('Create plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to create plan' });
  }
};

// ─── PUT /api/plans/:id ───────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, validity_months, max_family_members, benefits, is_active } = req.body;

    const result = await query(`
      UPDATE membership_plans
      SET name=$1, description=$2, price=$3, validity_months=$4, max_family_members=$5, benefits=$6, is_active=$7
      WHERE id = $8 RETURNING *
    `, [name, description, price, validity_months, max_family_members, JSON.stringify(benefits || []), is_active, id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    res.json({ success: true, message: 'Plan updated', data: result.rows[0] });
  } catch (error) {
    logger.error('Update plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to update plan' });
  }
};
