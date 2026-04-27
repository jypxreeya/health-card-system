const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../config/logger');

// ─── Generate Tokens ──────────────────────────────────────────────────────────
const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });

  return { accessToken, refreshToken };
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT id, name, email, phone, password_hash, role, hospital_id, is_active, profile_image_url
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    await query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, user.id]);

    // Get hospital info if applicable
    let hospital = null;
    if (user.hospital_id) {
      const hospResult = await query('SELECT id, name, code FROM hospitals WHERE id = $1', [user.hospital_id]);
      hospital = hospResult.rows[0] || null;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          hospital,
          profileImage: user.profile_image_url,
        },
        accessToken,
        refreshToken,
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// ─── POST /api/auth/patient-login/request-otp ───────────────────────────────
exports.requestPatientOtp = async (req, res) => {
  try {
    const { phone, cardNumber } = req.body;

    const result = await query(
      `SELECT p.id, p.full_name, p.phone, p.email, p.is_active, hc.card_number, hc.status as card_status 
       FROM patients p
       JOIN health_cards hc ON p.id = hc.patient_id
       WHERE p.phone = $1 AND UPPER(hc.card_number) = UPPER($2)`,
      [phone, cardNumber]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or card number' });
    }

    const patient = result.rows[0];

    if (!patient.is_active || patient.card_status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your health card is inactive or expired.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to database with 5 mins expiry
    await query(
      `UPDATE patients SET otp_code = $1, otp_expires_at = NOW() + INTERVAL '5 minutes' WHERE id = $2`,
      [otp, patient.id]
    );

    // Send email (or log to console if no email)
    const emailService = require('../services/email.service');
    const emailResult = await emailService.sendOtpEmail(patient, otp);

    // In dev mode (no Gmail), include OTP in response so the portal can show it
    const responseData = {
      phone: patient.phone,
      hasEmail: !!patient.email,
      emailSent: emailResult.sent,
    };
    if (emailResult.devOtp) {
      responseData.devOtp = emailResult.devOtp;
    }

    res.json({
      success: true,
      message: emailResult.sent ? 'OTP sent to your email' : 'OTP generated (dev mode)',
      data: responseData,
    });
  } catch (error) {
    logger.error('Request patient OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to request OTP' });
  }
};

// ─── POST /api/auth/patient-login/verify-otp ────────────────────────────────
exports.verifyPatientOtp = async (req, res) => {
  try {
    const { phone, cardNumber, otp } = req.body;

    const result = await query(
      `SELECT p.id, p.full_name, p.phone, p.otp_code, p.otp_expires_at, p.is_active, hc.card_number, hc.status as card_status 
       FROM patients p
       JOIN health_cards hc ON p.id = hc.patient_id
       WHERE p.phone = $1 AND UPPER(hc.card_number) = UPPER($2)`,
      [phone, cardNumber]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const patient = result.rows[0];

    if (!patient.is_active || patient.card_status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your health card is inactive or expired.' });
    }

    if (!patient.otp_code || patient.otp_code !== otp || new Date(patient.otp_expires_at) < new Date()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful login
    await query(`UPDATE patients SET otp_code = NULL, otp_expires_at = NULL WHERE id = $1`, [patient.id]);

    // Generate tokens specifically for patient
    const payload = { id: patient.id, role: 'patient' };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: patient.id,
          name: patient.full_name,
          phone: patient.phone,
          role: 'patient',
          cardNumber: patient.card_number,
        },
        accessToken,
        refreshToken,
      }
    });
  } catch (error) {
    logger.error('Verify patient OTP error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const result = await query(
      'SELECT id, name, email, role, hospital_id, is_active, refresh_token FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows.length || result.rows[0].refresh_token !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = result.rows[0];
    const tokens = generateTokens(user);

    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

    res.json({ success: true, data: tokens });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token expired, please login again' });
    }
    logger.error('Refresh token error:', error);
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.hospital_id, u.profile_image_url,
              u.last_login, u.created_at,
              h.name as hospital_name, h.code as hospital_code
       FROM users u
       LEFT JOIN hospitals h ON u.hospital_id = h.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, refresh_token = NULL WHERE id = $2', [newHash, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Password change failed' });
  }
};
