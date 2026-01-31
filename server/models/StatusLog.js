const mongoose = require('mongoose');

const StatusLogSchema = new mongoose.Schema({
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    previousStatus: { type: String },
    newStatus: { type: String, required: true },
    changedBy: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
});

module.exports = mongoose.model('StatusLog', StatusLogSchema);
