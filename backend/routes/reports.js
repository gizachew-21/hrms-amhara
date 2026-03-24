const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', authorize('hr_officer', 'department_head', 'finance_officer'), reportController.getDashboardStats);
router.get('/employee-stats', reportController.getEmployeeDashboardStats);
router.get('/employees', authorize('hr_officer', 'department_head', 'finance_officer'), reportController.getEmployeeReport);
router.get('/payroll', authorize('hr_officer', 'department_head', 'finance_officer'), reportController.getPayrollReport);
router.get('/vacancies', authorize('hr_officer', 'department_head', 'finance_officer'), reportController.getVacancyReport);
router.get('/audit-logs', authorize('hr_officer'), reportController.getAuditLogs);

module.exports = router;
