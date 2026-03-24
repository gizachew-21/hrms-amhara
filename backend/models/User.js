const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  // Support for multiple roles
  roles: [{
    type: String,
    enum: ['hr_officer', 'department_head', 'finance_officer', 'employee', 'applicant', 'admin']
  }],
  // Keep single role for backward compatibility
  role: {
    type: String,
    enum: ['hr_officer', 'department_head', 'finance_officer', 'employee', 'applicant', 'admin'],
    required: true
  },
  // Active role that user is currently using
  activeRole: {
    type: String,
    enum: ['hr_officer', 'department_head', 'finance_officer', 'employee', 'applicant', 'admin']
  },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Pre-save hook to sync roles array with role field
UserSchema.pre('save', async function (next) {
  // Initialize roles array if not exists
  if (!this.roles || this.roles.length === 0) {
    this.roles = [this.role];
  }
  
  // Ensure role is in roles array
  if (!this.roles.includes(this.role)) {
    this.roles.push(this.role);
  }
  
  // Set activeRole to role if not set
  if (!this.activeRole) {
    this.activeRole = this.role;
  }
  
  // Hash password if modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has a specific role
UserSchema.methods.hasRole = function (role) {
  return this.roles && this.roles.includes(role);
};

// Method to switch active role
UserSchema.methods.switchRole = function (newRole) {
  if (this.hasRole(newRole)) {
    this.activeRole = newRole;
    return true;
  }
  return false;
};

module.exports = mongoose.model('User', UserSchema);
