const crypto = require('crypto');

// Must be exactly 32 bytes for AES-256
// In production, this should come from a highly secure environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'nammasystem-super-secret-key-000';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a string using AES-256-CBC
 * @param {string} text - The raw text to encrypt
 * @returns {string|null} - The hex-encoded encrypted text with IV attached, or null if input is empty
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Return iv and encrypted data together as a single hex string, separated by a colon
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Fallback to raw text if encryption fails (optional, based on strictness)
  }
}

/**
 * Decrypts an AES-256-CBC encrypted string
 * @param {string} text - The encrypted text (format: ivHex:encryptedHex)
 * @returns {string|null} - The decrypted raw text, or original text if not encrypted properly
 */
function decrypt(text) {
  if (!text) return null;
  
  try {
    const textParts = text.split(':');
    
    // If it doesn't have an IV separator, it might be unencrypted legacy data
    if (textParts.length !== 2) return text;
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    // If decryption fails, it might just be unencrypted plaintext
    return text;
  }
}

module.exports = { encrypt, decrypt };
