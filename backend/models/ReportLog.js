const mongoose = require('mongoose');

const ReportLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g., 'GENERATE_PAYROLL_REPORT', 'VIEW_EMPLOYEE_SALARY'
    resourceType: { type: String }, // e.g., 'Payroll', 'Employee'
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: Object }, // Flexible field for extra info
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReportLog', ReportLogSchema);
