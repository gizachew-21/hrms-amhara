const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized to access this route' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = await User.findById(decoded.id).select('-password').populate('employee');

    if (!req.user || req.user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Admin always has access
    if (req.user.role === 'admin' || (req.user.roles && req.user.roles.includes('admin'))) {
      return next();
    }

    // Check if user's active role or any of their roles match
    const userActiveRole = req.user.activeRole || req.user.role;
    const userRoles = req.user.roles || [req.user.role];
    
    // Check if active role is authorized
    if (roles.includes(userActiveRole)) {
      return next();
    }
    
    // Check if any of user's roles are authorized
    const hasAuthorizedRole = userRoles.some(role => roles.includes(role));
    if (hasAuthorizedRole) {
      return next();
    }

    return res.status(403).json({
      error: `User role ${userActiveRole} is not authorized to access this route`
    });
  };
};

exports.optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = await User.findById(decoded.id).select('-password').populate('employee');
    }
    next();
  } catch (error) {
    // If token is invalid, we just continue without user
    next();
  }
};
