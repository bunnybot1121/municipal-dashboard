const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }, // Plain text for now
    role: { type: String, enum: ['admin', 'staff'], required: true },
    sector: { type: String }, // Optional
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
