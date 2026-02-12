const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In production, hash this!
    role: { type: String, enum: ['admin', 'staff', 'citizen'], default: 'staff' },
    name: { type: String, required: true },
    department: { type: String },
    sector: { type: String, enum: ['water', 'roads', 'lighting', 'waste', 'drainage', 'power', 'other'], default: 'other' },
    status: { type: String, enum: ['available', 'busy', 'offline'], default: 'available' },
    contact: { type: String }
}, {
    timestamps: true
});

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
