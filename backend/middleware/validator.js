const { body, validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

exports.registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['hr_officer', 'department_head', 'finance_officer', 'employee', 'applicant'])
    .withMessage('Invalid role')
];

exports.employeeValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('position').notEmpty().withMessage('Position is required'),
  body('basicSalary').isNumeric().withMessage('Basic salary must be a number')
];

exports.vacancyValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('numberOfPositions').isInt({ min: 1 }).withMessage('Number of positions must be at least 1'),
  body('description').notEmpty().withMessage('Description is required'),
  body('vacancyType').isIn(['internal', 'external', 'both']).withMessage('Invalid vacancy type'),
  body('applicationDeadline').isISO8601().withMessage('Valid application deadline is required')
];
