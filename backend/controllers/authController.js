const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await User.create({ email, password, role });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  console.log(`Login attempt for email: ${req.body.email}`);
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate({
      path: 'employee',
      populate: { path: 'department' }
    });

    if (!user || !(await user.comparePassword(password))) {
      console.log(`Login failed for ${email}: Invalid credentials`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        roles: user.roles || [user.role],
        activeRole: user.activeRole || user.role,
        employee: user.employee,
        department: user.employee?.department
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate({
      path: 'employee',
      populate: { path: 'department' }
    });

    // Ensure roles array exists
    if (!user.roles || user.roles.length === 0) {
      user.roles = [user.role];
    }

    // Ensure activeRole exists
    if (!user.activeRole) {
      user.activeRole = user.role;
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        roles: user.roles,
        activeRole: user.activeRole
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('employee', 'firstName middleName lastName employeeId department')
      .populate({
        path: 'employee',
        populate: { path: 'department', select: 'name' }
      })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { role, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.params.id;
    console.log(`Attempting password reset for user ID: ${userId}`);

    const user = await User.findById(userId);

    if (!user) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.password = password;
    await user.save();

    console.log(`Password reset successful for user: ${user.email}`);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Switch active role
exports.switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.user._id).populate({
      path: 'employee',
      populate: { path: 'department' }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.hasRole(role)) {
      return res.status(403).json({ success: false, error: 'You do not have access to this role' });
    }

    user.activeRole = role;
    await user.save();

    res.json({
      success: true,
      message: 'Role switched successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        roles: user.roles,
        activeRole: user.activeRole,
        employee: user.employee
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add role to user
exports.addRoleToUser = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.roles) {
      user.roles = [user.role];
    }

    if (user.roles.includes(role)) {
      return res.status(400).json({ success: false, error: 'User already has this role' });
    }

    user.roles.push(role);
    await user.save();

    res.json({ success: true, message: 'Role added successfully', data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Remove role from user
exports.removeRoleFromUser = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.roles || !user.roles.includes(role)) {
      return res.status(400).json({ success: false, error: 'User does not have this role' });
    }

    if (user.roles.length === 1) {
      return res.status(400).json({ success: false, error: 'Cannot remove the only role' });
    }

    user.roles = user.roles.filter(r => r !== role);

    // If removing active role, switch to first available role
    if (user.activeRole === role) {
      user.activeRole = user.roles[0];
    }

    // Update primary role if needed
    if (user.role === role) {
      user.role = user.roles[0];
    }

    await user.save();

    res.json({ success: true, message: 'Role removed successfully', data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
