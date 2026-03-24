const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  payrollNumber: { type: String, required: true, unique: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },

  // Period
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  paymentDate: { type: Date, required: true },

  // Earnings
  basicSalary: { type: Number, required: true },
  allowances: {
    transport: { type: Number, default: 0 },
    housing: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  overtime: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },

  // Deductions
  deductions: {
    incomeTax: { type: Number, default: 0 },
    pension: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // Totals
  grossSalary: { type: Number, required: true },
  totalDeductions: { type: Number, required: true },
  netSalary: { type: Number, required: true },

  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'pending_approval', 'approved', 'paid', 'cancelled'],
    default: 'pending'
  },

  // Approval Workflow
  preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },

  // Payment Details
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paidAt: { type: Date },
  paymentMethod: { type: String, enum: ['bank_transfer', 'cash', 'cheque'], default: 'bank_transfer' },
  transactionReference: { type: String },

  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', PayrollSchema);
