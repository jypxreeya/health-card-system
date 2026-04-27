const cron = require('node-cron');
const { query } = require('../config/database');
const logger = require('../config/logger');

/**
 * Initializes scheduled tasks
 */
const initCronJobs = () => {
  // Run every night at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    logger.info('🧹 Starting scheduled audit log cleanup...');
    try {
      // Delete logs older than 30 days
      const result = await query(
        "DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '30 days'"
      );
      logger.info(`✅ Audit log cleanup completed. Deleted ${result.rowCount} old logs.`);
    } catch (error) {
      logger.error('❌ Failed to cleanup old audit logs:', error.message);
    }
  });

  logger.info('⏰ Cron jobs initialized.');
};

module.exports = { initCronJobs };
