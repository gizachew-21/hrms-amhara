const express = require('express');
const router = express.Router();
const applicantController = require('../controllers/applicantController');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

router.post('/', upload.single('resume'), applicantController.createApplication);
router.get('/status/:applicationNumber', applicantController.checkStatus);
router.get('/:id', applicantController.getApplicantById);

router.use(protect);
router.use(logAction('applicant'));

router.get('/',
  authorize('hr_officer', 'department_head'),
  applicantController.getAllApplicants
);

router.put('/:id',
  authorize('hr_officer'),
  applicantController.updateApplicant
);

router.patch('/:id/screen',
  authorize('hr_officer', 'department_head'),
  applicantController.screenApplicant
);

router.patch('/:id/hire',
  authorize('hr_officer'),
  applicantController.hireApplicant
);

router.delete('/:id',
  authorize('hr_officer'),
  applicantController.deleteApplicant
);

module.exports = router;
