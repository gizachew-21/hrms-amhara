const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    requestType: {
        type: String,
        required: true,
        enum: ['account_access', 'software_install', 'hardware_request', 'data_access', 'other']
    },
    details: {
        type: String,
        required: true
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'in-progress', 'fulfilled', 'closed'],
        default: 'pending'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    fulfillmentDate: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
