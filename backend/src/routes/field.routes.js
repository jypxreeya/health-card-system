const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const fieldController = require('../controllers/field.controller');
const { authenticate, isFieldExecutive } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate, isFieldExecutive);

router.get('/visits', fieldController.getVisits);
router.post('/visits',
  [
    body('area').notEmpty().withMessage('Area required'),
    validate,
  ],
  fieldController.logVisit
);
router.get('/performance', fieldController.getPerformance);

module.exports = router;
