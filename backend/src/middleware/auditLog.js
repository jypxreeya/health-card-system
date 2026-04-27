const logger = require('../config/logger');
const { query } = require('../config/database');

const auditLog = (action, tableName) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    if (res.statusCode < 400 && req.user) {
      query(
        `INSERT INTO audit_logs (user_id, action, table_name, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          action,
          tableName,
          req.ip || req.connection?.remoteAddress,
          req.headers['user-agent']
        ]
      ).catch(err => logger.error('Audit log error:', err));
    }
    return originalJson(data);
  };

  next();
};

module.exports = auditLog;
