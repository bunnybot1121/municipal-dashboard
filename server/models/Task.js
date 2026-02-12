const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    scheduledStart: Date,
    scheduledEnd: Date,
    type: { type: String, default: 'maintenance' },
    sector: String,
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    location: {
        address: String,
        lat: Number,
        lng: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', TaskSchema);
