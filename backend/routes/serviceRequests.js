const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createServiceRequest, getServiceRequests, updateServiceRequest } = require('../controllers/serviceRequestController');

router.use(protect);

router.post('/', createServiceRequest);
router.get('/', getServiceRequests);
router.put('/:id', updateServiceRequest);

module.exports = router;
