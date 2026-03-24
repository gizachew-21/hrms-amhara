const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { loginValidation, registerValidation, validate } = require('../middleware/validator');

router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.get('/me', protect, authController.getMe);
router.get('/users', protect, authorize('admin'), authController.getUsers);
router.put('/users/:id', protect, authorize('admin'), authController.updateUser);
router.put('/users/:id/reset-password', protect, authorize('admin'), authController.resetUserPassword);
router.put('/update-password', protect, authController.updatePassword);

// Multi-role management
router.post('/switch-role', protect, authController.switchRole);
router.post('/users/:id/add-role', protect, authorize('admin'), authController.addRoleToUser);
router.post('/users/:id/remove-role', protect, authorize('admin'), authController.removeRoleFromUser);

module.exports = router;
