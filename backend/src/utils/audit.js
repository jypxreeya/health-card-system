const { query } = require('../config/database');
const logger = require('../config/logger');

/**
 * Logs an action to the audit_logs table
 * @param {string} userId - UUID of the user performing the action
 * @param {string} action - Describe the action (e.g., 'CREATE_PATIENT', 'UPDATE_PLAN')
 * @param {string} entity - The table or entity name (e.g., 'patients', 'membership_plans')
 * @param {string} entityId - UUID of the entity affected
 * @param {Object} details - Additional JSON details about the change
 */
const logAudit = async (userId, action, entity, entityId = null, details = {}) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entity, entityId, JSON.stringify(details)]
    );
  } catch (error) {
    logger.error('Failed to log audit event:', error.message);
  }
};

module.exports = { logAudit };
