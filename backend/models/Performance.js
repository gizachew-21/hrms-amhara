const mongoose = require('mongoose');

const PerformanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewDate: { type: Date, default: Date.now },
  reviewer: { type: String, required: true },
  score: { type: Number, min: 1, max: 5, required: true },
  comments: { type: String }
});

module.exports = mongoose.model('Performance', PerformanceSchema);
