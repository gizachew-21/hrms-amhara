const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');

router.get('/', performanceController.getAllPerformanceReviews);
router.get('/:id', performanceController.getPerformanceReviewById);
router.post('/', performanceController.createPerformanceReview);
router.put('/:id', performanceController.updatePerformanceReview);
router.delete('/:id', performanceController.deletePerformanceReview);

module.exports = router;
