const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const patientController = require('../controllers/patient.controller');
const { authenticate, isAnyStaff, isFieldExecutive } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

// Search (before /:id to avoid conflict)
router.get('/search', patientController.search);

// CRUD
router.get('/', isAnyStaff, patientController.getAll);

// Patient portal dashboard route
router.get('/me/dashboard', authenticate, patientController.getPatientDashboard);

router.get('/:id', patientController.getById);

router.post('/',
  isAnyStaff,
  [
    body('full_name').notEmpty().trim().withMessage('Full name required'),
    body('phone').isMobilePhone('en-IN').withMessage('Valid Indian phone number required'),
    body('email').optional().isEmail().withMessage('Valid email required'),
    validate,
  ],
  patientController.create
);

router.put('/:id', isAnyStaff, patientController.update);

// Family members
router.post('/:id/family-members',
  isAnyStaff,
  [
    body('name').notEmpty().withMessage('Member name required'),
    body('relationship').notEmpty().withMessage('Relationship required'),
    validate,
  ],
  patientController.addFamilyMember
);

module.exports = router;
