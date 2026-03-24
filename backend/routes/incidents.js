const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createIncident, getIncidents, updateIncident } = require('../controllers/incidentController');

router.use(protect);

router.post('/', createIncident);
router.get('/', getIncidents);
router.put('/:id', updateIncident);

module.exports = router;
