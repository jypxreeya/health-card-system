const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { authenticate, isAdmin, isSuperAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate, isAdmin);

// User management
router.get('/users', adminController.getUsers);
router.post('/users',
  isSuperAdmin,
  [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'field_executive', 'hospital_reception', 'field_manager']).withMessage('Invalid role'),
    validate,
  ],
  adminController.createUser
);
router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/reset-password',
  isSuperAdmin,
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
  adminController.resetPassword
);

// Reports
router.get('/reports/registrations', adminController.getRegistrationReport);
router.get('/reports/services', adminController.getServiceReport);

module.exports = router;
