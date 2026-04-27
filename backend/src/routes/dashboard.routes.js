const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, isAdmin, isHospitalStaff, isFieldExecutive } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', isHospitalStaff, dashboardController.getStats);
router.get('/field-stats', isFieldExecutive, dashboardController.getFieldStats);

module.exports = router;
