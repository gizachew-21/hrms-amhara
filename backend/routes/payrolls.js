const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

router.use(protect);
router.use(logAction('payroll'));

// ── IMPORTANT: Static paths MUST come before /:id ──────────────────────

// Salary Orders (HR + Finance)
router.get('/salary-orders',
  authorize('hr_officer', 'finance_officer'),
  payrollController.getAllSalaryOrders
);

// Finance Officer: mark salary order as payment_order_sent
router.patch('/salary-orders/:id/approve',
  authorize('finance_officer'),
  payrollController.approveSalaryOrder
);

// HR Officer: confirm receipt of payment order → processed
router.patch('/salary-orders/:id/confirm',
  authorize('hr_officer'),
  payrollController.confirmPaymentOrder
);

// Finance Officer: generate a single employee payroll
router.post('/',
  authorize('finance_officer'),
  payrollController.generatePayroll
);

// HR Officer or Finance Officer: bulk-generate monthly payrolls for all active employees
router.post('/generate-all',
  authorize('hr_officer', 'finance_officer'),
  payrollController.generateMonthlyPayrolls
);

// HR Officer: generate a salary order from existing payroll records
router.post('/generate-order',
  authorize('hr_officer'),
  payrollController.generateSalaryOrder
);

// ── Dynamic /:id routes MUST come after all static routes ──────────────

router.get('/',
  authorize('hr_officer', 'finance_officer', 'employee'),
  payrollController.getAllPayrolls
);

router.get('/:id',
  authorize('hr_officer', 'finance_officer', 'employee'),
  payrollController.getPayrollById
);

// HR Officer: approve a payroll record
router.patch('/:id/approve',
  authorize('hr_officer'),
  payrollController.approvePayroll
);

// Finance Officer: mark payroll as paid
router.patch('/:id/paid',
  authorize('finance_officer'),
  payrollController.markAsPaid
);

// Finance Officer: delete a payroll record
router.delete('/:id',
  authorize('finance_officer'),
  payrollController.deletePayroll
);

module.exports = router;
