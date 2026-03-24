const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const SalaryOrder = require('../models/SalaryOrder');
const AuditLog = require('../models/AuditLog');

// ── Ethiopian Income Tax Calculation ───────────────────────────────────
const calculateIncomeTax = (grossSalary) => {
  if (grossSalary <= 600) return 0;
  if (grossSalary <= 1650) return (grossSalary - 600) * 0.10;
  if (grossSalary <= 3200) return 105 + (grossSalary - 1650) * 0.15;
  if (grossSalary <= 5250) return 337.50 + (grossSalary - 3200) * 0.20;
  if (grossSalary <= 7800) return 747.50 + (grossSalary - 5250) * 0.25;
  if (grossSalary <= 10900) return 1385 + (grossSalary - 7800) * 0.30;
  return 2315 + (grossSalary - 10900) * 0.35;
};

// ── GET /api/payrolls ───────────────────────────────────────────────────
exports.getAllPayrolls = async (req, res) => {
  try {
    const { month, year, status, employee } = req.query;
    const filter = {};

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;

    const currentEmployee = await Employee.findOne({ user: req.user._id });

    if (req.user.role === 'employee') {
      if (currentEmployee) filter.employee = currentEmployee._id;
      else return res.json({ success: true, count: 0, data: [] });
    } else if (employee) {
      filter.employee = employee;
    } else if (req.query.my_records === 'true' && currentEmployee) {
      filter.employee = currentEmployee._id;
    }

    const payrolls = await Payroll.find(filter)
      .populate('employee', 'firstName middleName lastName employeeId position department bankDetails')
      .populate('preparedBy', 'email role')
      .populate('approvedBy', 'email role')
      .populate('paidBy', 'email role')
      .sort({ year: -1, month: -1 });

    res.json({ success: true, count: payrolls.length, data: payrolls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/payrolls/:id ───────────────────────────────────────────────
exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'firstName middleName lastName employeeId position department bankDetails')
      .populate('preparedBy', 'email role')
      .populate('approvedBy', 'email role');

    if (!payroll) return res.status(404).json({ error: 'Payroll not found' });

    res.json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/payrolls (single employee, Finance Officer) ───────────────
exports.generatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year, overtime, bonus, deductions } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const existing = await Payroll.findOne({ employee: employeeId, month, year });
    if (existing) return res.status(400).json({ error: 'Payroll already exists for this period' });

    const basicSalary = employee.basicSalary;
    const allowances = employee.allowances;
    const grossSalary = basicSalary
      + (allowances.transport || 0)
      + (allowances.housing || 0)
      + (allowances.other || 0)
      + (overtime || 0)
      + (bonus || 0);

    const incomeTax = calculateIncomeTax(grossSalary);
    const pension = grossSalary * 0.07;
    const totalDeductions = incomeTax + pension + (deductions?.loan || 0) + (deductions?.other || 0);
    const netSalary = grossSalary - totalDeductions;
    const payrollNumber = `PAY-${year}${String(month).padStart(2, '0')}-${employee.employeeId}`;

    const payroll = await Payroll.create({
      payrollNumber,
      employee: employeeId,
      month, year,
      paymentDate: req.body.paymentDate,
      basicSalary, allowances,
      overtime: overtime || 0,
      bonus: bonus || 0,
      deductions: { incomeTax, pension, loan: deductions?.loan || 0, other: deductions?.other || 0 },
      grossSalary, totalDeductions, netSalary,
      preparedBy: req.user._id
    });

    // Log Action
    await AuditLog.create({
      user: req.user._id,
      action: 'Generate Payroll (Single)',
      module: 'payroll',
      targetId: payroll._id,
      targetModel: 'Payroll',
      details: { payrollNumber: payroll.payrollNumber, employee: `${employee.firstName} ${employee.lastName}`, amount: netSalary }
    });

    res.status(201).json({ success: true, data: payroll });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ── POST /api/payrolls/generate-all ────────────────────────────────────
exports.generateMonthlyPayrolls = async (req, res) => {
  try {
    const month = parseInt(req.body.month);
    const year = parseInt(req.body.year);

    if (!month || !year)
      return res.status(400).json({ error: 'Month and year are required.' });

    const employees = await Employee.find({ status: 'active' });
    console.log(`[Payroll] generateMonthlyPayrolls: found ${employees.length} active employees for ${month}/${year}`);

    if (employees.length === 0)
      return res.status(400).json({ error: 'No active employees found in the database. Please check employee records.' });

    const createdPayrolls = [];
    const errors = [];
    let skipped = 0;

    for (const employee of employees) {
      try {
        const existing = await Payroll.findOne({ employee: employee._id, month, year });
        if (existing) { skipped++; continue; }

        const basicSalary = employee.basicSalary || 0;
        const allowances = employee.allowances || { transport: 0, housing: 0, other: 0 };
        const grossSalary = basicSalary
          + (allowances.transport || 0)
          + (allowances.housing || 0)
          + (allowances.other || 0);

        const incomeTax = calculateIncomeTax(grossSalary);
        const pension = grossSalary * 0.07;
        const totalDeductions = incomeTax + pension;
        const netSalary = grossSalary - totalDeductions;
        const payrollNumber = `PAY-${year}${String(month).padStart(2, '0')}-${employee.employeeId}`;

        const payroll = await Payroll.create({
          payrollNumber,
          employee: employee._id,
          month, year,
          paymentDate: new Date(year, month - 1, 28),
          basicSalary, allowances,
          overtime: 0, bonus: 0,
          deductions: { incomeTax, pension, loan: 0, other: 0 },
          grossSalary, totalDeductions, netSalary,
          preparedBy: req.user._id,
          status: 'pending'
        });

        createdPayrolls.push(payroll);
        console.log(`[Payroll] Created payroll for ${employee.employeeId}`);
      } catch (err) {
        console.error(`[Payroll] Failed for ${employee.employeeId}:`, err.message);
        errors.push({ employee: employee.employeeId, error: err.message });
      }
    }

    // All failed — return error with details
    if (createdPayrolls.length === 0 && errors.length > 0) {
      return res.status(400).json({
        error: `Failed to generate payrolls: ${errors[0].error}`,
        details: errors
      });
    }

    // All skipped (already exist)
    if (createdPayrolls.length === 0 && skipped > 0) {
      return res.json({
        success: true,
        message: `All ${skipped} employee(s) already have payrolls for ${month}/${year}. Check the "Payroll Records" tab.`,
        data: []
      });
    }

    // Log Action
    if (createdPayrolls.length > 0) {
      await AuditLog.create({
        user: req.user._id,
        action: 'Generate Monthly Payrolls',
        module: 'payroll',
        details: { month, year, count: createdPayrolls.length }
      });
    }

    res.json({
      success: true,
      message: `Generated ${createdPayrolls.length} payroll record(s)${skipped > 0 ? ` (${skipped} already existed)` : ''}.`,
      data: createdPayrolls,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('[Payroll] Fatal error in generateMonthlyPayrolls:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/payrolls/salary-orders ────────────────────────────────────
exports.getAllSalaryOrders = async (req, res) => {
  try {
    const orders = await SalaryOrder.find()
      .populate('preparedBy', 'email role')
      .populate('approvedBy', 'email role')
      .populate('confirmedBy', 'email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/payrolls/generate-order (HR Officer) ─────────────────────
exports.generateSalaryOrder = async (req, res) => {
  try {
    const month = parseInt(req.body.month);
    const year = parseInt(req.body.year);

    if (!month || !year)
      return res.status(400).json({ error: 'Month and year are required.' });

    console.log(`[Payroll] generateSalaryOrder: looking for payrolls for ${month}/${year}`);
    const payrolls = await Payroll.find({ month, year });
    console.log(`[Payroll] generateSalaryOrder: found ${payrolls.length} payrolls`);

    if (payrolls.length === 0)
      return res.status(400).json({ error: 'No payroll records found for this period. Please generate employee payrolls first.' });

    const totals = payrolls.reduce((acc, p) => {
      acc.totalGrossSalary += (p.grossSalary || 0);
      acc.totalNetSalary += (p.netSalary || 0);
      acc.totalDeductions += (p.totalDeductions || 0);
      return acc;
    }, { totalGrossSalary: 0, totalNetSalary: 0, totalDeductions: 0 });

    const orderNumber = `ORD-${year}${String(month).padStart(2, '0')}`;

    const salaryOrder = await SalaryOrder.create({
      orderNumber,
      month, year,
      totalEmployees: payrolls.length,
      totalGrossSalary: totals.totalGrossSalary,
      totalNetSalary: totals.totalNetSalary,
      totalDeductions: totals.totalDeductions,
      preparedBy: req.user._id,
      status: 'submitted_to_finance'
    });

    res.status(201).json({ success: true, data: salaryOrder });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ error: 'Salary order already exists for this period.' });
    res.status(400).json({ error: error.message });
  }
};

// ── PATCH /api/payrolls/salary-orders/:id/approve (Finance Officer) ────
// Finance sends the payment order back to HR
exports.approveSalaryOrder = async (req, res) => {
  try {
    const order = await SalaryOrder.findByIdAndUpdate(
      req.params.id,
      {
        status: 'payment_order_sent',
        approvedBy: req.user._id,
        approvedAt: Date.now(),
        paymentSentAt: Date.now()
      },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: 'Salary order not found' });

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ── PATCH /api/payrolls/salary-orders/:id/confirm (HR Officer) ─────────
// HR confirms receipt of Finance's payment order → marks as processed
exports.confirmPaymentOrder = async (req, res) => {
  try {
    const order = await SalaryOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Salary order not found' });

    if (order.status !== 'payment_order_sent')
      return res.status(400).json({ error: 'Order is not in payment_order_sent status' });

    order.status = 'processed';
    order.confirmedBy = req.user._id;
    order.confirmedAt = Date.now();
    order.processedAt = Date.now();
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ── PATCH /api/payrolls/:id/approve (HR Officer approves a payroll) ─────
exports.approvePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedAt: Date.now() },
      { new: true }
    );

    if (!payroll) return res.status(404).json({ error: 'Payroll not found' });

    res.json({ success: true, data: payroll });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ── PATCH /api/payrolls/:id/paid (Finance Officer) ──────────────────────
exports.markAsPaid = async (req, res) => {
  try {
    const { transactionReference } = req.body;

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', transactionReference, paidBy: req.user._id, paidAt: Date.now() },
      { new: true }
    ).populate('employee', 'firstName middleName lastName employeeId position')
     .populate('approvedBy', 'email')
     .populate('paidBy', 'email');

    if (!payroll) return res.status(404).json({ error: 'Payroll not found' });

    res.json({ success: true, data: payroll });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ── DELETE /api/payrolls/:id ────────────────────────────────────────────
exports.deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) return res.status(404).json({ error: 'Payroll not found' });
    res.json({ success: true, message: 'Payroll deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
