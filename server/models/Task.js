const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    assignedTo: { type: String, required: true }, // username or staffId
    department: { type: String, required: true },
    scheduledDate: { type: String, required: true }, // YYYY-MM-DD
    scheduledTime: { type: String, required: true }, // HH:MM
    status: { type: String, enum: ['Assigned', 'In-Progress', 'Completed'], default: 'Assigned' },
    slaDeadline: { type: Date }
});

module.exports = mongoose.model('Task', TaskSchema);
