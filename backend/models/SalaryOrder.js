const mongoose = require('mongoose');

const SalaryOrderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },

    // Aggregated Data
    totalEmployees: { type: Number, required: true },
    totalGrossSalary: { type: Number, required: true },
    totalNetSalary: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },

    // Workflow status
    // draft -> submitted_to_finance -> payment_order_sent -> processed
    status: {
        type: String,
        enum: ['draft', 'submitted_to_finance', 'payment_order_sent', 'processed'],
        default: 'draft'
    },

    // HR Officer who created the order
    preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    preparedAt: { type: Date, default: Date.now },

    // Finance Officer who sent the payment order
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    paymentSentAt: Date,

    // HR Officer who confirmed receipt of payment order
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: Date,

    // Final processed timestamp
    processedAt: Date,

    notes: String
});

module.exports = mongoose.model('SalaryOrder', SalaryOrderSchema);
