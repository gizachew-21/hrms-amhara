const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  
  // Current Position
  currentPosition: { type: String, required: true },
  currentDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  currentSalary: { type: Number, required: true },
  
  // Proposed Position
  proposedPosition: { type: String, required: true },
  proposedDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  proposedSalary: { type: Number, required: true },
  
  // Justification
  reason: { type: String, required: true },
  achievements: [String],
  performanceScore: { type: Number, min: 1, max: 5 },
  
  // Workflow
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestDate: { type: Date, default: Date.now },
  
  departmentHeadRecommendation: {
    status: { type: String, enum: ['pending', 'recommended', 'not_recommended'] },
    comments: String,
    recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recommendedAt: Date
  },
  
  hrApproval: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    comments: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },
  
  // Final Status
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'recommended', 'approved', 'rejected', 'implemented'], 
    default: 'pending' 
  },
  
  effectiveDate: { type: Date },
  implementedAt: { type: Date }
});

module.exports = mongoose.model('Promotion', PromotionSchema);
