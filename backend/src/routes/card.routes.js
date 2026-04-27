const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cardController = require('../controllers/card.controller');
const { authenticate, isAdmin, isAnyStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', cardController.getAll);
router.get('/:cardNumber', cardController.getByCardNumber);
router.get('/:id/pdf', cardController.generatePdf);
router.post('/:id/send-email', isAnyStaff, cardController.sendCardByEmail);
router.put('/:id/status',
  isAdmin,
  [
    body('status').isIn(['active', 'inactive', 'expired', 'suspended']).withMessage('Invalid status'),
    validate,
  ],
  cardController.updateStatus
);

module.exports = router;
