const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');
const { employeeValidation, validate } = require('../middleware/validator');
const { logAction } = require('../middleware/auditLog');
const Employee = require('../models/Employee');

// Public route - verify if email belongs to an AITB employee (no auth required)
router.post('/verify-member', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ isMember: false });

    const normalizedEmail = email.toLowerCase().trim();

    // Find employee by email only first (no status filter)
    const employee = await Employee.findOne({ email: normalizedEmail });

    if (!employee) {
      return res.json({ isMember: false });
    }

    // Check employee is not terminated/suspended
    if (employee.status === 'terminated' || employee.status === 'suspended') {
      return res.json({ isMember: false });
    }

    // Verify the password against the User account
    const User = require('../models/User');
    const userAccount = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!userAccount) {
      return res.json({ isMember: false });
    }

    const isPasswordValid = await userAccount.comparePassword(password);
    if (!isPasswordValid) {
      return res.json({ isMember: false, wrongPassword: true });
    }

    res.json({ isMember: true });
  } catch (error) {
    res.status(500).json({ isMember: false });
  }
});

router.use(protect);
router.use(logAction('employee'));

router.get('/',
  authorize('hr_officer', 'department_head', 'finance_officer'),
  employeeController.getAllEmployees
);

router.get('/me', employeeController.getEmployeeMe);

router.get('/:id', employeeController.getEmployeeById);

router.post('/',
  authorize('hr_officer'),
  employeeValidation,
  validate,
  employeeController.createEmployee
);

router.put('/:id',
  authorize('hr_officer'),
  employeeController.updateEmployee
);

router.delete('/:id',
  authorize('hr_officer'),
  employeeController.deleteEmployee
);

module.exports = router;
