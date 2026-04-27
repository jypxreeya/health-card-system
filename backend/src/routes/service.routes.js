const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const serviceController = require('../controllers/service.controller');
const { authenticate, isHospitalStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/categories', serviceController.getCategories);
router.get('/', serviceController.getAll);

router.post('/',
  isHospitalStaff,
  [
    body('card_number').notEmpty().withMessage('Card number required'),
    body('service_type').notEmpty().withMessage('Service type required'),
    validate,
  ],
  serviceController.create
);

module.exports = router;
