const mongoose = require('mongoose');

const ApplicantSchema = new mongoose.Schema({
  applicationNumber: { type: String, required: true, unique: true },
  vacancy: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacancy', required: true },

  // Personal Information
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  nationality: { type: String, default: 'Ethiopian' },

  // Contact Information
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  alternatePhone: { type: String },
  address: {
    region: String,
    city: String,
    subcity: String,
    woreda: String
  },

  // Education
  education: [{
    level: { type: String, enum: ['diploma', 'bachelor', 'master', 'phd'], required: true },
    fieldOfStudy: { type: String, required: true },
    institution: { type: String, required: true },
    graduationYear: { type: Number, required: true },
    gpa: Number
  }],

  // Work Experience
  workExperience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    responsibilities: String,
    reasonForLeaving: String
  }],

  // Skills & Certifications
  skills: [String],
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date
  }],

  // Documents
  documents: {
    resume: { fileName: String, filePath: String },
    coverLetter: { fileName: String, filePath: String },
    certificates: [{ fileName: String, filePath: String }],
    idDocument: { fileName: String, filePath: String }
  },

  // Application Status
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'recommended', 'shortlisted', 'interview_scheduled', 'passed', 'reserved', 'rejected', 'hired'],
    default: 'submitted'
  },

  // Evaluation
  screeningScore: { type: Number, min: 0, max: 100 },
  screeningNotes: { type: String },
  interviewScore: { type: Number, min: 0, max: 100 },
  interviewNotes: { type: String },
  finalScore: { type: Number, min: 0, max: 100 },

  // Tracking
  appliedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  interviewDate: { type: Date }
});

ApplicantSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`;
});

ApplicantSchema.virtual('age').get(function () {
  return Math.floor((Date.now() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

ApplicantSchema.set('toJSON', { virtuals: true });
ApplicantSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Applicant', ApplicantSchema);
