const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

// Public route to get all departments (needed for dropdowns)
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);

// Protected routes for HR officers
router.use(protect);

router.post('/',
    authorize('hr_officer'),
    departmentController.createDepartment
);

router.put('/:id',
    authorize('hr_officer'),
    departmentController.updateDepartment
);

router.delete('/:id',
    authorize('hr_officer'),
    departmentController.deleteDepartment
);

module.exports = router;
