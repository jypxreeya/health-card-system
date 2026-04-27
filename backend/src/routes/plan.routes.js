const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const planController = require('../controllers/plan.controller');
const { authenticate, isAdmin, isAnyStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', planController.getAll);
router.get('/:id', planController.getById);

router.post('/',
  isAdmin,
  [
    body('name').notEmpty().withMessage('Plan name required'),
    body('code').notEmpty().withMessage('Plan code required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('validity_months').isInt({ min: 1 }).withMessage('Validity months required'),
    body('max_family_members').isInt({ min: 1 }).withMessage('Max family members required'),
    validate,
  ],
  planController.create
);

router.put('/:id', isAdmin, planController.update);

module.exports = router;
