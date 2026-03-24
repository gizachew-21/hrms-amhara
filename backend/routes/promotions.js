const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

router.use(protect);
router.use(logAction('promotion'));

router.get('/', promotionController.getAllPromotions);
router.get('/:id', promotionController.getPromotionById);

router.post('/', 
  authorize('employee', 'hr_officer'), 
  promotionController.createPromotion
);

router.patch('/:id/recommend', 
  authorize('department_head'), 
  promotionController.recommendPromotion
);

router.patch('/:id/approve', 
  authorize('hr_officer'), 
  promotionController.approvePromotion
);

router.delete('/:id', 
  authorize('hr_officer'), 
  promotionController.deletePromotion
);

module.exports = router;
