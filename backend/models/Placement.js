const mongoose = require('mongoose');

const PlacementSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', required: true },
  vacancy: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacancy', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  
  placementDate: { type: Date, required: true },
  startDate: { type: Date, required: true },
  probationPeriod: { type: Number, default: 3 }, // months
  probationEndDate: { type: Date },
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'probation', 'permanent', 'cancelled'], 
    default: 'pending' 
  },
  
  notes: { type: String },
  placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Placement', PlacementSchema);
