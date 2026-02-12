const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g., 'LOGIN', 'CREATE_ISSUE', 'UPDATE_STATUS'
    details: String,
    entityId: mongoose.Schema.Types.ObjectId, // ID of related issue/task
    entityType: String
}, {
    timestamps: true
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
