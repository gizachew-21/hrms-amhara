const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', leaveController.getAllLeaveRequests);
router.get('/:id', leaveController.getLeaveRequestById);
router.post('/', leaveController.createLeaveRequest);
router.put('/:id', leaveController.updateLeaveRequest);
router.delete('/:id', leaveController.deleteLeaveRequest);

module.exports = router;
