const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const hospitalController = require('../controllers/hospital.controller');
const { authenticate, isAdmin, isAnyStaff } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', hospitalController.getAll);
router.get('/:id', hospitalController.getById);

router.post('/',
  isAdmin,
  [
    body('name').notEmpty().withMessage('Hospital name required'),
    body('code').notEmpty().withMessage('Hospital code required'),
    body('city').notEmpty().withMessage('City required'),
    validate,
  ],
  hospitalController.create
);

router.put('/:id', isAdmin, hospitalController.update);

module.exports = router;
