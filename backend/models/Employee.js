const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  nationality: { type: String, default: 'Ethiopian' },

  // Contact Information
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  alternatePhone: { type: String },
  address: {
    region: String,
    city: String,
    subcity: String,
    woreda: String,
    houseNumber: String
  },

  // Employment Details
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  position: { type: String, required: true },
  employmentType: { type: String, enum: ['permanent', 'contract', 'temporary'], required: true },
  dateJoined: { type: Date, required: true },
  contractEndDate: { type: Date },
  status: { type: String, enum: ['active', 'on_leave', 'suspended', 'terminated'], default: 'active' },

  // Salary & Bank Details
  basicSalary: { type: Number, required: true },
  allowances: {
    transport: { type: Number, default: 0 },
    housing: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountHolderName: String
  },

  // Education & Qualifications
  education: [{
    level: { type: String, enum: ['diploma', 'bachelor', 'master', 'phd'] },
    fieldOfStudy: String,
    institution: String,
    graduationYear: Number,
    gpa: Number
  }],

  // Skills & Certifications
  skills: [String],
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date
  }],

  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },

  // Documents
  documents: [{
    type: { type: String, enum: ['resume', 'certificate', 'id', 'contract', 'other'] },
    fileName: String,
    filePath: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Performance & Promotion
  performanceRating: { type: Number, min: 1, max: 5 },
  lastPromotionDate: { type: Date },
  promotionEligibleDate: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

EmployeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.middleName || this.lastName}`;
});

EmployeeSchema.virtual('hireDate').get(function () {
  return this.dateJoined;
});

EmployeeSchema.virtual('totalSalary').get(function () {
  return this.basicSalary + (this.allowances?.transport || 0) + (this.allowances?.housing || 0) + (this.allowances?.other || 0);
});

EmployeeSchema.set('toJSON', { virtuals: true });
EmployeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employee', EmployeeSchema);
