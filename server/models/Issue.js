const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['emergency', 'maintenance', 'citizen'], required: true },
    sector: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved', 'scheduled', 'completed'], default: 'pending' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    reportedAt: { type: Date, default: Date.now },
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    imageUrl: { type: String },
    seasonalFactor: { type: Number },
    aiAnalysis: { type: Object } // Store AI Engine results
}, {
    timestamps: true
});

module.exports = mongoose.model('Issue', IssueSchema);
