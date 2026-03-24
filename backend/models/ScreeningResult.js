const mongoose = require('mongoose');

const ScreeningResultSchema = new mongoose.Schema({
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', required: true },
    vacancy: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacancy', required: true },
    screener: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Department Head

    status: {
        type: String,
        enum: ['recommended', 'passed', 'shortlisted', 'reserved', 'rejected'],
        required: true
    },

    comments: { type: String },
    screenedAt: { type: Date, default: Date.now }
});

// Ensure one screening per applicant per vacancy
ScreeningResultSchema.index({ applicant: 1, vacancy: 1 }, { unique: true });

module.exports = mongoose.model('ScreeningResult', ScreeningResultSchema);
