const nodemailer = require('nodemailer');
const logger = require('../config/logger');
const cardService = require('./card.service');

// Check if Gmail credentials are actually configured (not placeholder values)
const isGmailConfigured = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  return user && pass && user !== 'your@gmail.com' && pass !== 'your_gmail_app_password';
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const BRAND = {
  primary: '#e61d62',
  secondary: '#004791',
  name: process.env.APP_NAME || 'Namma Health Card',
};

// ─── Base Email Template ──────────────────────────────────────────────────────
function baseTemplate(content, title) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Red Hat Display', sans-serif; background: #f5f7fb; color: #1a2332; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${BRAND.secondary} 0%, ${BRAND.primary} 100%); padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center; }
    .header h1 { color: white; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; }
    .body { background: white; padding: 40px; border-left: 1px solid #e8edf5; border-right: 1px solid #e8edf5; }
    .body h2 { font-size: 20px; color: ${BRAND.secondary}; margin-bottom: 12px; }
    .body p { font-size: 14px; line-height: 1.7; color: #4a5568; margin-bottom: 12px; }
    .card-box { background: linear-gradient(135deg, ${BRAND.secondary}, ${BRAND.primary}); border-radius: 14px; padding: 24px; margin: 24px 0; color: white; }
    .card-box .card-num { font-size: 22px; font-weight: 700; letter-spacing: 3px; text-align: center; font-family: monospace; }
    .card-box .card-label { font-size: 11px; text-align: center; opacity: 0.75; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
    .info-item { background: #f8faff; border: 1px solid #e8edf5; border-radius: 8px; padding: 12px 16px; }
    .info-item .label { font-size: 11px; color: #8896ab; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item .value { font-size: 14px; font-weight: 600; color: ${BRAND.secondary}; margin-top: 2px; }
    .benefits-list { list-style: none; margin: 16px 0; }
    .benefits-list li { padding: 8px 0; border-bottom: 1px solid #f0f4ff; font-size: 13px; color: #4a5568; }
    .benefits-list li::before { content: "✓ "; color: ${BRAND.primary}; font-weight: 700; }
    .cta-btn { display: block; background: ${BRAND.primary}; color: white; text-align: center; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 24px 0; }
    .footer { background: #f8faff; border: 1px solid #e8edf5; border-top: none; padding: 20px 40px; border-radius: 0 0 16px 16px; text-align: center; }
    .footer p { font-size: 12px; color: #8896ab; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏥 ${BRAND.name}</h1>
      <p>Your Trusted Healthcare Partner</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>This is an automated message from ${BRAND.name}.<br>
      Please do not reply to this email. For support, contact your registered hospital.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send Welcome Email with Health Card ─────────────────────────────────────
async function sendWelcomeEmail(patient, card) {
  try {
    if (!patient.email) return;

    const planBenefits = card.benefits ? JSON.parse(card.benefits) : [];
    const validUntil = new Date(card.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const content = `
      <h2>Welcome to ${BRAND.name}! 🎉</h2>
      <p>Dear <strong>${patient.full_name}</strong>,</p>
      <p>Congratulations! Your health card has been successfully registered. Here are your card details:</p>
      
      <div class="card-box">
        <div class="card-label">Your Health Card Number</div>
        <div class="card-num">${card.card_number}</div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">Card Holder</div>
          <div class="value">${patient.full_name}</div>
        </div>
        <div class="info-item">
          <div class="label">Plan</div>
          <div class="value">${card.plan_name || 'Health Plan'}</div>
        </div>
        <div class="info-item">
          <div class="label">Valid Until</div>
          <div class="value">${validUntil}</div>
        </div>
        <div class="info-item">
          <div class="label">Status</div>
          <div class="value">✅ Active</div>
        </div>
      </div>

      ${planBenefits.length > 0 ? `
      <p><strong>Your Benefits:</strong></p>
      <ul class="benefits-list">
        ${planBenefits.map(b => `<li>${b}</li>`).join('')}
      </ul>` : ''}

      <p>Present your <strong>card number</strong> or <strong>registered phone number</strong> at any partnered hospital to avail your benefits.</p>
      <p>Thank you for choosing ${BRAND.name} for your healthcare needs!</p>
    `;

    await transporter.sendMail({
      from: `"${BRAND.name}" <${process.env.GMAIL_USER}>`,
      to: patient.email,
      subject: `🏥 Welcome to ${BRAND.name} – Your Card: ${card.card_number}`,
      html: baseTemplate(content, `Welcome – ${BRAND.name}`),
    });

    logger.info(`Welcome email sent to ${patient.email}`);
  } catch (error) {
    logger.error('Welcome email error:', error);
    throw error;
  }
}

// ─── Send Health Card Email (with PDF attachment) ─────────────────────────────
async function sendHealthCard(cardData) {
  try {
    const pdfBuffer = await cardService.generateHealthCardPDF(cardData);
    const validUntil = new Date(cardData.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const content = `
      <h2>Your Digital Health Card</h2>
      <p>Dear <strong>${cardData.full_name}</strong>,</p>
      <p>Please find your digital health card attached to this email as a PDF.</p>

      <div class="card-box">
        <div class="card-label">Health Card Number</div>
        <div class="card-num">${cardData.card_number}</div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">Plan</div>
          <div class="value">${cardData.plan_name}</div>
        </div>
        <div class="info-item">
          <div class="label">Valid Until</div>
          <div class="value">${validUntil}</div>
        </div>
      </div>

      <p>Save this email or download the attached PDF card. Present this card number at the hospital reception to avail your benefits.</p>
    `;

    await transporter.sendMail({
      from: `"${BRAND.name}" <${process.env.GMAIL_USER}>`,
      to: cardData.email,
      subject: `🏥 Your ${BRAND.name} Health Card – ${cardData.card_number}`,
      html: baseTemplate(content, 'Your Health Card'),
      attachments: [{
        filename: `HealthCard-${cardData.card_number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    logger.info(`Health card email sent to ${cardData.email}`);
  } catch (error) {
    logger.error('Health card email error:', error);
    throw error;
  }
}

// ─── Send Service Used Notification ──────────────────────────────────────────
async function sendServiceNotification(patient, service) {
  try {
    if (!patient.email) return;

    const content = `
      <h2>Service Recorded at ${service.hospital_name}</h2>
      <p>Dear <strong>${patient.full_name}</strong>,</p>
      <p>We have recorded a service utilization under your health card. Here are the details:</p>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">Date</div>
          <div class="value">${new Date(service.visit_date).toLocaleDateString('en-IN')}</div>
        </div>
        <div class="info-item">
          <div class="label">Hospital</div>
          <div class="value">${service.hospital_name}</div>
        </div>
        <div class="info-item">
          <div class="label">Service</div>
          <div class="value">${service.service_type}</div>
        </div>
        ${service.doctor_name ? `
        <div class="info-item">
          <div class="label">Doctor</div>
          <div class="value">${service.doctor_name}</div>
        </div>` : ''}
        ${service.original_amount ? `
        <div class="info-item">
          <div class="label">Original Amount</div>
          <div class="value">₹${service.original_amount}</div>
        </div>
        <div class="info-item">
          <div class="label">Discount</div>
          <div class="value">₹${service.discount_amount} (${service.discount_percentage}%)</div>
        </div>` : ''}
      </div>

      <p>Thank you for using ${BRAND.name}. We hope you had a pleasant experience!</p>
    `;

    await transporter.sendMail({
      from: `"${BRAND.name}" <${process.env.GMAIL_USER}>`,
      to: patient.email,
      subject: `✅ Service Recorded – ${service.service_type} at ${service.hospital_name}`,
      html: baseTemplate(content, 'Service Notification'),
    });

    logger.info(`Service notification sent to ${patient.email}`);
  } catch (error) {
    logger.error('Service notification email error:', error);
    throw error;
  }
}

// ─── Send Card Expiry Reminder ────────────────────────────────────────────────
async function sendExpiryReminder(patient, card, daysLeft) {
  try {
    if (!patient.email) return;

    const content = `
      <h2>⚠️ Your Health Card Expires in ${daysLeft} Days</h2>
      <p>Dear <strong>${patient.full_name}</strong>,</p>
      <p>Your health card <strong>${card.card_number}</strong> is expiring soon. Renew it to continue enjoying your healthcare benefits.</p>

      <div class="card-box">
        <div class="card-label">Expiry Date</div>
        <div class="card-num">${new Date(card.valid_until).toLocaleDateString('en-IN')}</div>
      </div>

      <p>Please contact your healthcare provider or visit the nearest partnered hospital to renew your card before it expires.</p>
    `;

    await transporter.sendMail({
      from: `"${BRAND.name}" <${process.env.GMAIL_USER}>`,
      to: patient.email,
      subject: `⚠️ Your ${BRAND.name} Card Expires in ${daysLeft} Days`,
      html: baseTemplate(content, 'Card Expiry Reminder'),
    });

    logger.info(`Expiry reminder sent to ${patient.email}`);
  } catch (error) {
    logger.error('Expiry reminder email error:', error);
    throw error;
  }
}

// ─── Send OTP Email ────────────────────────────────────────────────────────────
// Returns: { sent: boolean, devOtp?: string }
// - sent: true if email was dispatched via Gmail
// - devOtp: the OTP itself, only present in dev mode (Gmail not configured)
async function sendOtpEmail(patient, otp) {
  // ─ DEV FALLBACK: If Gmail is not configured, log loudly and return OTP in result ─
  if (!isGmailConfigured()) {
    // Loud console.log so it is impossible to miss in ANY terminal
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              🔑  DEV MODE — OTP GENERATED               ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Patient : ${(patient.full_name + ' (' + patient.phone + ')').padEnd(46)} ║`);
    console.log(`║  OTP     : ${otp.padEnd(46)} ║`);
    console.log(`║  Email   : ${(patient.email || '(none on file)').padEnd(46)} ║`);
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  Gmail not configured — OTP shown on portal screen too  ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('\n');

    logger.warn(`[DEV MODE] OTP for ${patient.full_name}: ${otp} (also returned in API response)`);
    // Return OTP so controller can include it in the API response
    return { sent: false, devOtp: otp };
  }

  // ─ No email on record — still dev-safe ─
  if (!patient.email) {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║        🔑  OTP GENERATED (no email on record)           ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Patient : ${(patient.full_name + ' (' + patient.phone + ')').padEnd(46)} ║`);
    console.log(`║  OTP     : ${otp.padEnd(46)} ║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('\n');
    logger.warn(`[NO EMAIL] OTP for ${patient.full_name}: ${otp}`);
    return { sent: false, devOtp: otp };
  }

  try {
    const content = `
      <h2>Login Verification Code</h2>
      <p>Dear <strong>${patient.full_name}</strong>,</p>
      <p>Please use the following 6-digit verification code to securely access your Namma Health portal.</p>
      
      <div class="card-box" style="margin: 32px 0;">
        <div class="card-label">Your Secure OTP</div>
        <div class="card-num" style="font-size: 32px; letter-spacing: 8px;">${otp}</div>
      </div>

      <p style="color: #d32f2f; font-weight: 600; font-size: 13px;">⚠️ This code will expire in 5 minutes.</p>
      <p>If you did not request this code, please ignore this email.</p>
    `;

    await transporter.sendMail({
      from: `"${BRAND.name}" <${process.env.GMAIL_USER}>`,
      to: patient.email,
      subject: `🔒 Your ${BRAND.name} Login Code: ${otp}`,
      html: baseTemplate(content, 'Login Verification'),
    });

    logger.info(`OTP email sent to ${patient.email}`);
    return { sent: true };
  } catch (error) {
    // Log the error but DO NOT throw — OTP is already saved in DB
    logger.error('OTP email delivery failed (non-fatal):', error.message);
    // Return OTP as dev fallback since email failed
    return { sent: false, devOtp: otp };
  }
}

module.exports = { sendWelcomeEmail, sendHealthCard, sendServiceNotification, sendExpiryReminder, sendOtpEmail };
