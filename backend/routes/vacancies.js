const express = require('express');
const router = express.Router();
const vacancyController = require('../controllers/vacancyController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const { vacancyValidation, validate } = require('../middleware/validator');
const { logAction } = require('../middleware/auditLog');

router.get('/', optionalProtect, vacancyController.getAllVacancies);
router.get('/:id', optionalProtect, vacancyController.getVacancyById);

// Protected routes below
router.use(protect);
router.use(logAction('vacancy'));

router.post('/',
  authorize('hr_officer', 'department_head'),
  vacancyValidation,
  validate,
  vacancyController.createVacancy
);

router.patch('/:id/approve',
  authorize('hr_officer'),
  vacancyController.approveVacancy
);

router.put('/:id',
  authorize('hr_officer'),
  vacancyController.updateVacancy
);

router.delete('/:id',
  authorize('hr_officer'),
  vacancyController.deleteVacancy
);

router.patch('/:id/publish',
  authorize('hr_officer'),
  vacancyController.publishVacancy
);

module.exports = router;
