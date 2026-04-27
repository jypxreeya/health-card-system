const express = require('express');
const router = express.Router();
const { query: dbQuery } = require('../config/database');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate);

// GET /api/notifications - list notification logs
router.get('/', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', type = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = ['1=1'];
    let params = [];
    let idx = 1;

    if (status) { conditions.push(`status = $${idx}`); params.push(status); idx++; }
    if (type) { conditions.push(`type = $${idx}`); params.push(type); idx++; }

    const result = await dbQuery(`
      SELECT n.*, p.full_name as patient_name
      FROM notifications n
      LEFT JOIN patients p ON n.patient_id = p.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY n.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, parseInt(limit), offset]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

module.exports = router;
