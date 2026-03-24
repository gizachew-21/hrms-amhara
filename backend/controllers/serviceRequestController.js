const ServiceRequest = require('../models/ServiceRequest');

// Create service request
exports.createServiceRequest = async (req, res) => {
    try {
        const { requestType, details, priority } = req.body;
        const request = new ServiceRequest({
            requestType,
            details,
            priority,
            requester: req.user.id
        });
        await request.save();
        res.status(201).json({ success: true, data: request });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get all service requests
exports.getServiceRequests = async (req, res) => {
    try {
        let query = {};
        if (!['admin', 'hr_officer'].includes(req.user.role)) {
            query.requester = req.user.id;
        }
        const requests = await ServiceRequest.find(query).populate({
            path: 'requester',
            select: 'email',
            populate: {
                path: 'employee',
                select: 'firstName middleName lastName'
            }
        }).sort('-createdAt');
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Update service request
exports.updateServiceRequest = async (req, res) => {
    try {
        const { status, assignedTo, priority } = req.body;
        let request = await ServiceRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        if (status === 'fulfilled' || status === 'closed') {
            request.fulfillmentDate = Date.now();
        }

        request.status = status || request.status;
        request.assignedTo = assignedTo || request.assignedTo;
        request.priority = priority || request.priority;

        await request.save();
        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
