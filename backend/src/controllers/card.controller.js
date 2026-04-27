const { query } = require('../config/database');
const logger = require('../config/logger');
const { logAudit } = require('../utils/audit');
const cardService = require('../services/card.service');
const emailService = require('../services/email.service');
const { decrypt } = require('../utils/crypto');

// ─── GET /api/cards ───────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', search = '', plan_id = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = ['1=1'];
    let params = [];
    let idx = 1;

    if (status) { conditions.push(`hc.status = $${idx}`); params.push(status); idx++; }
    if (plan_id) { conditions.push(`hc.plan_id = $${idx}`); params.push(plan_id); idx++; }
    if (search) {
      conditions.push(`(hc.card_number ILIKE $${idx} OR p.full_name ILIKE $${idx} OR p.phone ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (req.user.role === 'hospital_reception') {
      conditions.push(`hc.hospital_id = $${idx}`);
      params.push(req.user.hospital_id);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    const [data, count] = await Promise.all([
      query(`
        SELECT hc.id, hc.card_number, hc.status, hc.valid_from, hc.valid_until,
               hc.registration_date, hc.pdf_card_url,
               p.id as patient_id, p.full_name, p.phone, p.photo_url,
               mp.name as plan_name, mp.code as plan_code, mp.price as plan_price,
               h.name as hospital_name,
               (SELECT COUNT(*) FROM family_members fm WHERE fm.patient_id = p.id AND fm.is_active = true) as family_count
        FROM health_cards hc
        JOIN patients p ON hc.patient_id = p.id
        JOIN membership_plans mp ON hc.plan_id = mp.id
        LEFT JOIN hospitals h ON hc.hospital_id = h.id
        WHERE ${whereClause}
        ORDER BY hc.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, parseInt(limit), offset]),
      query(`
        SELECT COUNT(*) as total FROM health_cards hc
        JOIN patients p ON hc.patient_id = p.id
        WHERE ${whereClause}
      `, params),
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
    logger.error('Get cards error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cards' });
  }
};

// ─── GET /api/cards/:cardNumber ───────────────────────────────────────────────
exports.getByCardNumber = async (req, res) => {
  try {
    const { cardNumber } = req.params;

    const result = await query(`
      SELECT hc.*, p.full_name, p.phone, p.email, p.gender, p.age, p.area, p.city,
             p.photo_url, p.address,
             mp.name as plan_name, mp.code as plan_code, mp.benefits, mp.price,
             mp.max_family_members, mp.validity_months,
             h.name as hospital_name, h.code as hospital_code,
             u.name as issued_by_name
      FROM health_cards hc
      JOIN patients p ON hc.patient_id = p.id
      JOIN membership_plans mp ON hc.plan_id = mp.id
      LEFT JOIN hospitals h ON hc.hospital_id = h.id
      LEFT JOIN users u ON hc.issued_by = u.id
      WHERE UPPER(hc.card_number) = UPPER($1) OR p.phone = $1
    `, [cardNumber]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const card = result.rows[0];
    if (card && card.address) {
      card.address = decrypt(card.address);
    }

    // Fetch family members
    const familyResult = await query(
      'SELECT * FROM family_members WHERE patient_id = $1 AND is_active = true',
      [card.patient_id]
    );

    // Fetch recent services
    const servicesResult = await query(`
      SELECT su.*, h.name as hospital_name
      FROM service_utilization su
      JOIN hospitals h ON su.hospital_id = h.id
      WHERE su.card_id = $1
      ORDER BY su.visit_date DESC LIMIT 10
    `, [card.id]);

    res.json({
      success: true,
      data: {
        ...card,
        family_members: familyResult.rows,
        recent_services: servicesResult.rows,
      }
    });
  } catch (error) {
    logger.error('Get card by number error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch card' });
  }
};

// ─── POST /api/cards/:id/generate-pdf ────────────────────────────────────────
exports.generatePdf = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT hc.*, p.full_name, p.phone, p.email, p.gender, p.age, p.photo_url,
             mp.name as plan_name, mp.code as plan_code, mp.benefits,
             h.name as hospital_name
      FROM health_cards hc
      JOIN patients p ON hc.patient_id = p.id
      JOIN membership_plans mp ON hc.plan_id = mp.id
      LEFT JOIN hospitals h ON hc.hospital_id = h.id
      WHERE hc.id = $1
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const card = result.rows[0];
    const familyResult = await query(
      'SELECT * FROM family_members WHERE patient_id = $1 AND is_active = true',
      [card.patient_id]
    );

    const pdfBuffer = await cardService.generateHealthCardPDF({
      ...card,
      family_members: familyResult.rows,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="HealthCard-${card.card_number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Generate PDF error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};

// ─── PUT /api/cards/:id/status ────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['active', 'inactive', 'expired', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await query(
      'UPDATE health_cards SET status = $1, notes = $2 WHERE id = $3 RETURNING *',
      [status, notes || null, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    // Log Audit
    logAudit(req.user.id, 'UPDATE_CARD_STATUS', 'health_cards', id, {
      status: status,
      card_number: result.rows[0].card_number
    });

    res.json({ success: true, message: `Card status updated to ${status}`, data: result.rows[0] });
  } catch (error) {
    logger.error('Update card status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update card status' });
  }
};

// ─── POST /api/cards/:id/send-email ──────────────────────────────────────────
exports.sendCardByEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT hc.*, p.full_name, p.phone, p.email, mp.name as plan_name, mp.code as plan_code, mp.benefits
      FROM health_cards hc
      JOIN patients p ON hc.patient_id = p.id
      JOIN membership_plans mp ON hc.plan_id = mp.id
      WHERE hc.id = $1
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const card = result.rows[0];
    if (!card.email) {
      return res.status(400).json({ success: false, message: 'Patient has no email address' });
    }

    const familyResult = await query('SELECT * FROM family_members WHERE patient_id = $1 AND is_active = true', [card.patient_id]);
    await emailService.sendHealthCard({ ...card, family_members: familyResult.rows });

    res.json({ success: true, message: `Health card sent to ${card.email}` });
  } catch (error) {
    logger.error('Send card email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send card email' });
  }
};
