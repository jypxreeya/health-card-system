const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const logger = require('../config/logger');

const BRAND = {
  primary: '#e61d62',
  secondary: '#004791',
  name: process.env.APP_NAME || 'Namma Health Card',
};

// ─── Generate QR Code Data URL ────────────────────────────────────────────────
async function generateQRCode(data) {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: { dark: BRAND.secondary, light: '#ffffff' },
      width: 200,
    });
  } catch (error) {
    logger.error('QR code generation error:', error);
    throw error;
  }
}

// ─── Generate Health Card HTML ────────────────────────────────────────────────
function generateCardHTML(cardData) {
  const {
    card_number, full_name, phone, gender, age,
    plan_name, plan_code, valid_until, valid_from,
    family_members = [], benefits = [], qrCodeDataUrl,
  } = cardData;

  const validFrom = new Date(valid_from || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const validUntilStr = new Date(valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const parsedBenefits = typeof benefits === 'string' ? JSON.parse(benefits) : benefits;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Red Hat Display', Arial, sans-serif; background: #f0f4ff; padding: 20px; }

    /* ── Card Front ── */
    .card-front {
      width: 85.6mm; height: 53.98mm;
      background: linear-gradient(135deg, ${BRAND.secondary} 0%, #0066cc 50%, ${BRAND.primary} 100%);
      border-radius: 12px; padding: 14px; color: white;
      position: relative; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,71,145,0.35);
    }
    .card-front::before {
      content: ''; position: absolute; top: -30px; right: -30px;
      width: 120px; height: 120px; border-radius: 50%;
      background: rgba(255,255,255,0.08);
    }
    .card-front::after {
      content: ''; position: absolute; bottom: -40px; left: -20px;
      width: 140px; height: 140px; border-radius: 50%;
      background: rgba(255,255,255,0.05);
    }
    .card-logo { font-size: 10px; font-weight: 700; letter-spacing: 1px; opacity: 0.9; text-transform: uppercase; }
    .card-logo span { color: ${BRAND.primary}; }
    .card-logo-icon { font-size: 14px; }
    .card-number-section { margin-top: 10px; }
    .card-num-label { font-size: 7px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.8px; }
    .card-number { font-size: 14px; font-weight: 700; letter-spacing: 2px; font-family: 'Courier New', monospace; margin-top: 2px; }
    .card-holder { margin-top: 8px; }
    .card-holder-label { font-size: 7px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.8px; }
    .card-holder-name { font-size: 11px; font-weight: 600; margin-top: 1px; }
    .card-bottom { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px; }
    .card-validity { }
    .card-validity-label { font-size: 7px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.8px; }
    .card-validity-date { font-size: 10px; font-weight: 600; margin-top: 1px; }
    .card-plan-badge {
      background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
      border-radius: 20px; padding: 3px 10px; font-size: 8px; font-weight: 600;
    }

    /* ── PDF Layout ── */
    .pdf-page { max-width: 794px; margin: 0 auto; }
    .pdf-header {
      background: linear-gradient(135deg, ${BRAND.secondary}, ${BRAND.primary});
      padding: 28px 40px; border-radius: 16px; color: white;
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px;
    }
    .pdf-header h1 { font-size: 24px; font-weight: 700; }
    .pdf-header p { font-size: 12px; opacity: 0.8; margin-top: 4px; }
    .pdf-body { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .pdf-section {
      background: white; border-radius: 12px; padding: 24px;
      border: 1px solid #e8edf5;
    }
    .pdf-section h3 { font-size: 13px; color: ${BRAND.secondary}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e8edf5; }
    .info-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f5f7fb; font-size: 12px; }
    .info-row .key { color: #8896ab; }
    .info-row .val { font-weight: 600; color: #1a2332; }
    .benefit-item { padding: 6px 0; border-bottom: 1px solid #f5f7fb; font-size: 12px; color: #4a5568; }
    .benefit-item::before { content: "✓ "; color: ${BRAND.primary}; font-weight: 700; }
    .family-item { padding: 8px 12px; background: #f8faff; border-radius: 8px; margin-bottom: 8px; font-size: 12px; }
    .family-item .fname { font-weight: 600; color: ${BRAND.secondary}; }
    .family-item .frel { color: #8896ab; font-size: 11px; }
    .qr-section { text-align: center; }
    .qr-section img { width: 120px; height: 120px; }
    .qr-section p { font-size: 10px; color: #8896ab; margin-top: 8px; }
    .status-badge {
      display: inline-block; padding: 4px 12px; border-radius: 20px;
      font-size: 11px; font-weight: 600;
      background: #e6fff2; color: #00a854;
    }
    .full-width { grid-column: 1 / -1; }
  </style>
</head>
<body>
<div class="pdf-page">
  <!-- Header -->
  <div class="pdf-header">
    <div>
      <h1>🏥 ${BRAND.name}</h1>
      <p>Official Health Card Document</p>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;opacity:0.7">Card Number</div>
      <div style="font-size:20px;font-weight:700;font-family:monospace;letter-spacing:2px">${card_number}</div>
    </div>
  </div>

  <div class="pdf-body">
    <!-- Card Holder Info -->
    <div class="pdf-section">
      <h3>👤 Card Holder Details</h3>
      <div class="info-row"><span class="key">Full Name</span><span class="val">${full_name}</span></div>
      <div class="info-row"><span class="key">Phone</span><span class="val">${phone}</span></div>
      ${gender ? `<div class="info-row"><span class="key">Gender</span><span class="val" style="text-transform:capitalize">${gender}</span></div>` : ''}
      ${age ? `<div class="info-row"><span class="key">Age</span><span class="val">${age} years</span></div>` : ''}
      <div class="info-row"><span class="key">Status</span><span class="val"><span class="status-badge">✓ Active</span></span></div>
    </div>

    <!-- Card Details -->
    <div class="pdf-section">
      <h3>💳 Membership Details</h3>
      <div class="info-row"><span class="key">Card Number</span><span class="val" style="font-family:monospace">${card_number}</span></div>
      <div class="info-row"><span class="key">Plan</span><span class="val">${plan_name}</span></div>
      <div class="info-row"><span class="key">Valid From</span><span class="val">${validFrom}</span></div>
      <div class="info-row"><span class="key">Valid Until</span><span class="val">${validUntilStr}</span></div>
    </div>

    <!-- Benefits -->
    ${parsedBenefits.length > 0 ? `
    <div class="pdf-section">
      <h3>🎁 Your Benefits</h3>
      ${parsedBenefits.map(b => `<div class="benefit-item">${b}</div>`).join('')}
    </div>` : ''}

    <!-- QR Code + Family -->
    <div class="pdf-section" style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
      ${qrCodeDataUrl ? `
      <div class="qr-section">
        <img src="${qrCodeDataUrl}" alt="QR Code">
        <p>Scan at hospital reception<br>Card: ${card_number}</p>
      </div>` : ''}
    </div>

    <!-- Family Members -->
    ${family_members.length > 0 ? `
    <div class="pdf-section full-width">
      <h3>👨‍👩‍👧‍👦 Family Members (${family_members.length})</h3>
      ${family_members.map(m => `
        <div class="family-item">
          <span class="fname">${m.name}</span>
          <span class="frel"> • ${m.relationship}${m.age ? ` • ${m.age} yrs` : ''}${m.gender ? ` • ${m.gender}` : ''}</span>
        </div>
      `).join('')}
    </div>` : ''}
  </div>

  <!-- Footer Note -->
  <div style="margin-top:20px;padding:16px;background:white;border-radius:10px;border:1px solid #e8edf5;font-size:11px;color:#8896ab;text-align:center">
    This is an official health card issued by ${BRAND.name}. Present this card or your registered phone number at any partnered hospital.
    For any queries, contact your healthcare provider.
  </div>
</div>
</body>
</html>`;
}

// ─── Generate PDF ─────────────────────────────────────────────────────────────
async function generateHealthCardPDF(cardData) {
  let browser;
  try {
    // Generate QR code
    const qrData = JSON.stringify({
      card: cardData.card_number,
      patient: cardData.full_name,
      phone: cardData.phone,
    });
    const qrCodeDataUrl = await generateQRCode(qrData);

    const html = generateCardHTML({ ...cardData, qrCodeDataUrl });

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    logger.info(`PDF generated for card: ${cardData.card_number}`);
    return pdfBuffer;
  } catch (error) {
    logger.error('PDF generation error:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generateHealthCardPDF, generateQRCode };
