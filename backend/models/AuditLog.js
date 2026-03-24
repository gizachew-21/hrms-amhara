const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  module: {
    type: String,
    enum: ['auth', 'employee', 'vacancy', 'applicant', 'placement', 'promotion', 'payroll', 'leave', 'performance', 'user', 'department'],
    required: true
  },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetModel: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
});

AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ module: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
