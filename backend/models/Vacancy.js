const mongoose = require('mongoose');

const VacancySchema = new mongoose.Schema({
  title: { type: String, required: true },
  vacancyNumber: { type: String, required: true, unique: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  position: { type: String, required: true },
  numberOfPositions: { type: Number, required: true, min: 1 },

  // Job Details
  description: { type: String, required: true },
  responsibilities: [String],
  requirements: {
    education: { type: String, required: true },
    experience: { type: String, required: true },
    skills: [String],
    otherRequirements: [String]
  },

  // Salary & Benefits
  salaryRange: {
    min: Number,
    max: Number
  },
  benefits: [String],

  // Vacancy Type & Dates
  vacancyType: { type: String, enum: ['internal', 'external', 'both'], required: true },
  announcementDate: { type: Date, required: true },
  applicationDeadline: { type: Date, required: true },
  expectedStartDate: { type: Date },

  // Status
  status: { type: String, enum: ['draft', 'pending_approval', 'published', 'closed', 'filled'], default: 'draft' },

  // Documents
  attachments: [{
    fileName: String,
    filePath: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Tracking
  totalApplications: { type: Number, default: 0 },
  shortlistedCount: { type: Number, default: 0 },
  hiredCount: { type: Number, default: 0 },

  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vacancy', VacancySchema);
