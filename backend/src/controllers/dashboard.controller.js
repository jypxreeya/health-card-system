const { query } = require('../config/database');
const logger = require('../config/logger');

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const hospitalFilter = req.user.role === 'hospital_reception'
      ? `AND hospital_id = '${req.user.hospital_id}'` : '';

    const fieldFilter = req.user.role === 'field_executive'
      ? `AND registered_by = '${req.user.id}'` : '';

    const [totalPatients, activeCards, todayRegistrations, totalServices, expiringCards, recentActivity] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM patients WHERE is_active = true ${fieldFilter}`),
      query(`SELECT COUNT(*) as count FROM health_cards WHERE status = 'active' ${hospitalFilter}`),
      query(`SELECT COUNT(*) as count FROM patients WHERE DATE(created_at) = CURRENT_DATE ${fieldFilter}`),
      query(`SELECT COUNT(*) as count FROM service_utilization WHERE DATE(created_at) >= NOW() - INTERVAL '30 days' ${hospitalFilter}`),
      query(`SELECT COUNT(*) as count FROM health_cards WHERE status = 'active' AND valid_until BETWEEN NOW() AND NOW() + INTERVAL '30 days' ${hospitalFilter}`),
      query(`
        SELECT p.full_name, p.phone, hc.card_number, hc.created_at,
               mp.name as plan_name, 'registration' as type
        FROM health_cards hc
        JOIN patients p ON hc.patient_id = p.id
        JOIN membership_plans mp ON hc.plan_id = mp.id
        ORDER BY hc.created_at DESC LIMIT 5
      `),
    ]);

    // Monthly trend (last 6 months)
    const monthlyTrend = await query(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
             COUNT(*) as registrations
      FROM patients
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    // Plan distribution
    const planDistribution = await query(`
      SELECT mp.name, mp.code, COUNT(*) as count
      FROM health_cards hc
      JOIN membership_plans mp ON hc.plan_id = mp.id
      WHERE hc.status = 'active'
      GROUP BY mp.id, mp.name, mp.code
      ORDER BY count DESC
    `);

    // Service utilization by category (last 30 days)
    const serviceByCategory = await query(`
      SELECT service_category, COUNT(*) as count,
             COALESCE(SUM(original_amount), 0) as total_amount,
             COALESCE(SUM(discount_amount), 0) as total_discount
      FROM service_utilization
      WHERE visit_date >= NOW() - INTERVAL '30 days'
      GROUP BY service_category
      ORDER BY count DESC
      LIMIT 8
    `);

    res.json({
      success: true,
      data: {
        stats: {
          total_patients: parseInt(totalPatients.rows[0].count),
          active_cards: parseInt(activeCards.rows[0].count),
          today_registrations: parseInt(todayRegistrations.rows[0].count),
          services_this_month: parseInt(totalServices.rows[0].count),
          expiring_cards: parseInt(expiringCards.rows[0].count),
        },
        monthly_trend: monthlyTrend.rows,
        plan_distribution: planDistribution.rows,
        service_by_category: serviceByCategory.rows,
        recent_activity: recentActivity.rows,
      }
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// ─── GET /api/dashboard/field-stats ──────────────────────────────────────────
exports.getFieldStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [todayVisits, todayRegistrations, totalRegistrations, weeklyPerformance] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM field_visits WHERE field_executive_id = $1 AND visit_date = CURRENT_DATE`, [userId]),
      query(`SELECT COUNT(*) as count FROM patients WHERE registered_by = $1 AND DATE(created_at) = CURRENT_DATE`, [userId]),
      query(`SELECT COUNT(*) as count FROM patients WHERE registered_by = $1`, [userId]),
      query(`
        SELECT DATE(created_at) as date, COUNT(*) as registrations
        FROM patients WHERE registered_by = $1 AND created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY date
      `, [userId]),
    ]);

    res.json({
      success: true,
      data: {
        today_visits: parseInt(todayVisits.rows[0].count),
        today_registrations: parseInt(todayRegistrations.rows[0].count),
        total_registrations: parseInt(totalRegistrations.rows[0].count),
        weekly_performance: weeklyPerformance.rows,
      }
    });
  } catch (error) {
    logger.error('Field stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch field stats' });
  }
};
