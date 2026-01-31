const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    sector: { type: String, enum: ['roads', 'water', 'drainage', 'lighting'], required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String, required: true }
    },
    severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    status: { type: String, enum: ['Pending', 'In-Progress', 'Completed'], default: 'Pending' },
    source: { type: String, enum: ['citizen', 'staff', 'system'], default: 'citizen' },

    // Citizen Module Fields
    imageUrl: { type: String }, // Base64 or URL
    rawGps: {
        latitude: Number,
        longitude: Number,
        accuracy: Number,
        timestamp: Number
    },
    isGeoVerified: { type: Boolean, default: false },

    // Seasonal Logic Field
    seasonalFactor: { type: Number, default: 1.0 }, // 1.0 = Normal, 1.5 = High Priority etc.

    // Evidence Consistency Validation (Stage B)
    evidenceCheck: {
        consistencyScore: { type: Number, default: 0 }, // 0-100
        isInconsistent: { type: Boolean, default: false }, // Replaces isFake
        flags: [{ type: String }], // e.g. ["GPS_DATA_MISMATCH"]
        validatedAt: { type: Date }
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issue', IssueSchema);
