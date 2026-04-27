const { query, getClient } = require('../config/database');
const logger = require('../config/logger');
const cardService = require('../services/card.service');
const emailService = require('../services/email.service');

// ─── Helper: Generate Card Number ────────────────────────────────────────────
async function generateCardNumber() {
  const year = new Date().getFullYear();
  const seqResult = await query("SELECT nextval('card_number_seq') as seq");
  const seq = String(seqResult.rows[0].seq).padStart(5, '0');
  const prefix = process.env.CARD_NUMBER_PREFIX || 'NHC';
  return `${prefix}-${year}-${seq}`;
}

// ─── GET /api/patients ────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search = '', status = '',
      hospital_id = '', registered_by = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = ['1=1'];
    let params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(p.full_name ILIKE $${idx} OR p.phone ILIKE $${idx} OR hc.card_number ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    // Role-based filtering
    if (req.user.role === 'hospital_reception') {
      conditions.push(`p.hospital_id = $${idx}`);
      params.push(req.user.hospital_id);
      idx++;
    } else if (req.user.role === 'field_executive') {
      conditions.push(`p.registered_by = $${idx}`);
      params.push(req.user.id);
      idx++;
    } else {
      if (hospital_id) { conditions.push(`p.hospital_id = $${idx}`); params.push(hospital_id); idx++; }
      if (registered_by) { conditions.push(`p.registered_by = $${idx}`); params.push(registered_by); idx++; }
    }

    if (status) { conditions.push(`hc.status = $${idx}`); params.push(status); idx++; }

    const whereClause = conditions.join(' AND ');

    const [dataResult, countResult] = await Promise.all([
      query(`
        SELECT p.id, p.full_name, p.phone, p.email, p.gender, p.age, p.area, p.city,
               p.created_at, p.is_active, p.photo_url,
               hc.card_number, hc.status as card_status, hc.valid_until,
               mp.name as plan_name, mp.code as plan_code,
               u.name as registered_by_name,
               (SELECT COUNT(*) FROM family_members fm WHERE fm.patient_id = p.id AND fm.is_active = true) as family_count
        FROM patients p
        LEFT JOIN health_cards hc ON hc.patient_id = p.id
        LEFT JOIN membership_plans mp ON hc.plan_id = mp.id
        LEFT JOIN users u ON p.registered_by = u.id
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, parseInt(limit), offset]),
      query(`
        SELECT COUNT(DISTINCT p.id) as total
        FROM patients p
        LEFT JOIN health_cards hc ON hc.patient_id = p.id
        WHERE ${whereClause}
      `, params),
    ]);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].total / parseInt(limit)),
      }
    });
  } catch (error) {
    logger.error('Get patients error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch patients' });
  }
};

// ─── GET /api/patients/:id ────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [patientResult, familyResult, cardsResult, servicesResult] = await Promise.all([
      query(`
        SELECT p.*, u.name as registered_by_name, h.name as hospital_name
        FROM patients p
        LEFT JOIN users u ON p.registered_by = u.id
        LEFT JOIN hospitals h ON p.hospital_id = h.id
        WHERE p.id = $1
      `, [id]),
      query(`SELECT * FROM family_members WHERE patient_id = $1 AND is_active = true ORDER BY name`, [id]),
      query(`
        SELECT hc.*, mp.name as plan_name, mp.code as plan_code, mp.benefits,
               u.name as issued_by_name
        FROM health_cards hc
        JOIN membership_plans mp ON hc.plan_id = mp.id
        LEFT JOIN users u ON hc.issued_by = u.id
        WHERE hc.patient_id = $1
        ORDER BY hc.created_at DESC
      `, [id]),
      query(`
        SELECT su.*, h.name as hospital_name, u.name as recorded_by_name,
               fm.name as family_member_name
        FROM service_utilization su
        JOIN hospitals h ON su.hospital_id = h.id
        LEFT JOIN users u ON su.recorded_by = u.id
        LEFT JOIN family_members fm ON su.family_member_id = fm.id
        WHERE su.patient_id = $1
        ORDER BY su.visit_date DESC
        LIMIT 20
      `, [id]),
    ]);

    if (!patientResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      data: {
        ...patientResult.rows[0],
        family_members: familyResult.rows,
        health_cards: cardsResult.rows,
        recent_services: servicesResult.rows,
      }
    });
  } catch (error) {
    logger.error('Get patient error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch patient' });
  }
};

// ─── POST /api/patients ───────────────────────────────────────────────────────
exports.create = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      full_name, phone, email, gender, age, date_of_birth,
      address, area, city, state, pincode,
      plan_id, family_members = []
    } = req.body;

    // Check duplicate phone
    const dupCheck = await client.query('SELECT id FROM patients WHERE phone = $1', [phone]);
    if (dupCheck.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'A patient with this phone number already exists',
        existing_id: dupCheck.rows[0].id
      });
    }

    // Create patient
    const patientResult = await client.query(`
      INSERT INTO patients (full_name, phone, email, gender, age, date_of_birth, address, area, city, state, pincode, registered_by, hospital_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      full_name, phone, email || null, gender || null, age || null,
      date_of_birth || null, address || null, area || null,
      city || null, state || null, pincode || null,
      req.user.id,
      req.user.hospital_id || null
    ]);

    const patient = patientResult.rows[0];

    // Insert family members
    for (const member of family_members) {
      await client.query(`
        INSERT INTO family_members (patient_id, name, relationship, age, gender, phone, date_of_birth)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [patient.id, member.name, member.relationship, member.age || null, member.gender || null, member.phone || null, member.date_of_birth || null]);
    }

    // Generate health card if plan provided
    let healthCard = null;
    if (plan_id) {
      const cardNumber = await generateCardNumber();
      const planResult = await client.query('SELECT * FROM membership_plans WHERE id = $1', [plan_id]);
      const plan = planResult.rows[0];

      if (!plan) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Invalid membership plan' });
      }

      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + plan.validity_months);

      const cardResult = await client.query(`
        INSERT INTO health_cards (card_number, patient_id, plan_id, valid_until, issued_by, hospital_id)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
      `, [cardNumber, patient.id, plan_id, validUntil, req.user.id, req.user.hospital_id || null]);

      healthCard = cardResult.rows[0];
    }

    await client.query('COMMIT');

    // Fetch complete patient data
    const completePatient = await query(`
      SELECT p.*, hc.card_number, hc.id as card_id, hc.status as card_status, hc.valid_until,
             mp.name as plan_name
      FROM patients p
      LEFT JOIN health_cards hc ON hc.patient_id = p.id
      LEFT JOIN membership_plans mp ON hc.plan_id = mp.id
      WHERE p.id = $1
    `, [patient.id]);

    // Send welcome email (async - don't block response)
    if (email && healthCard) {
      emailService.sendWelcomeEmail(patient, healthCard).catch(err =>
        logger.error('Welcome email failed:', err)
      );
    }

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: completePatient.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Create patient error:', error);
    res.status(500).json({ success: false, message: 'Failed to register patient' });
  } finally {
    client.release();
  }
};

// ─── PUT /api/patients/:id ────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, gender, age, date_of_birth, address, area, city, state, pincode, notes } = req.body;

    const result = await query(`
      UPDATE patients
      SET full_name=$1, email=$2, gender=$3, age=$4, date_of_birth=$5,
          address=$6, area=$7, city=$8, state=$9, pincode=$10, notes=$11
      WHERE id = $12
      RETURNING *
    `, [full_name, email, gender, age, date_of_birth, address, area, city, state, pincode, notes, id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, message: 'Patient updated', data: result.rows[0] });
  } catch (error) {
    logger.error('Update patient error:', error);
    res.status(500).json({ success: false, message: 'Failed to update patient' });
  }
};

// ─── GET /api/patients/search ─────────────────────────────────────────────────
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Search query too short' });
    }

    const result = await query(`
      SELECT p.id, p.full_name, p.phone, p.age, p.gender, p.area, p.city,
             hc.card_number, hc.status as card_status, hc.valid_until,
             mp.name as plan_name
      FROM patients p
      LEFT JOIN health_cards hc ON hc.patient_id = p.id
      LEFT JOIN membership_plans mp ON hc.plan_id = mp.id
      WHERE p.full_name ILIKE $1 OR p.phone ILIKE $1 OR hc.card_number ILIKE $1
      LIMIT 10
    `, [`%${q}%`]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Search patients error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// ─── POST /api/patients/:id/family-members ────────────────────────────────────
exports.addFamilyMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relationship, age, gender, phone, date_of_birth } = req.body;

    // Check family member limit per plan
    const cardResult = await query(`
      SELECT mp.max_family_members,
             (SELECT COUNT(*) FROM family_members fm WHERE fm.patient_id = $1 AND fm.is_active = true) as current_count
      FROM health_cards hc
      JOIN membership_plans mp ON hc.plan_id = mp.id
      WHERE hc.patient_id = $1 AND hc.status = 'active'
    `, [id]);

    if (cardResult.rows.length > 0) {
      const { max_family_members, current_count } = cardResult.rows[0];
      if (parseInt(current_count) >= parseInt(max_family_members)) {
        return res.status(400).json({
          success: false,
          message: `Family member limit reached (max: ${max_family_members} for current plan)`
        });
      }
    }

    const result = await query(`
      INSERT INTO family_members (patient_id, name, relationship, age, gender, phone, date_of_birth)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [id, name, relationship, age || null, gender || null, phone || null, date_of_birth || null]);

    res.status(201).json({ success: true, message: 'Family member added', data: result.rows[0] });
  } catch (error) {
    logger.error('Add family member error:', error);
    res.status(500).json({ success: false, message: 'Failed to add family member' });
  }
};
