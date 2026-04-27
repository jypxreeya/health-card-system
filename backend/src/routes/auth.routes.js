const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    validate,
  ],
  authController.login
);

router.post('/patient-login/request-otp',
  [
    body('phone').notEmpty().withMessage('Phone number required'),
    body('cardNumber').notEmpty().withMessage('Card number required'),
    validate,
  ],
  authController.requestPatientOtp
);

router.post('/patient-login/verify-otp',
  [
    body('phone').notEmpty().withMessage('Phone number required'),
    body('cardNumber').notEmpty().withMessage('Card number required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP required'),
    validate,
  ],
  authController.verifyPatientOtp
);
router.post('/refresh',
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
  validate,
  authController.refreshToken
);

router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

router.put('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate,
  ],
  authController.changePassword
);

module.exports = router;
