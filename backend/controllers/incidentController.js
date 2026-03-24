const Incident = require('../models/Incident');

// Create new incident
exports.createIncident = async (req, res) => {
    try {
        const { title, description, priority, category } = req.body;
        const incident = new Incident({
            title,
            description,
            priority,
            category,
            reporter: req.user.id
        });
        await incident.save();
        res.status(201).json({ success: true, data: incident });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get all incidents
exports.getIncidents = async (req, res) => {
    try {
        let query = {};
        // If user is not admin or HR, they only see their own incidents
        if (!['admin', 'hr_officer'].includes(req.user.role)) {
            query.reporter = req.user.id;
        }
        const incidents = await Incident.find(query).populate({
            path: 'reporter',
            select: 'email',
            populate: {
                path: 'employee',
                select: 'firstName middleName lastName'
            }
        }).sort('-createdAt');
        res.status(200).json({ success: true, data: incidents });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Update incident status/priority
exports.updateIncident = async (req, res) => {
    try {
        const { status, priority, resolution } = req.body;
        let incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({ success: false, error: 'Incident not found' });
        }

        // Only Admin or HR can resolve
        if (status === 'resolved' || status === 'closed') {
            if (!['admin', 'hr_officer'].includes(req.user.role)) {
                return res.status(403).json({ success: false, error: 'Unauthorized to resolve incidents' });
            }
            incident.resolvedAt = Date.now();
            incident.resolvedBy = req.user.id;
            incident.resolution = resolution;
        }

        incident.status = status || incident.status;
        incident.priority = priority || incident.priority;

        await incident.save();
        res.status(200).json({ success: true, data: incident });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
