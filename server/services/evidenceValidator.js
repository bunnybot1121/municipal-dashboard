/**
 * Evidence Consistency Validation (Stage B)
 * This runs SERVER-SIDE to validate internal consistency of submitted evidence.
 */

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const validateEvidence = (issueData) => {
    const validation = {
        consistencyScore: 100,
        isInconsistent: false,
        flags: [],
        validatedAt: new Date()
    };

    const { rawGps, location, imageUrl } = issueData;

    // 1. GPS Internal Consistency
    // Compares the provided 'location' (which may be resolved address coords) against 'rawGps' (hardware coords)
    if (rawGps && rawGps.latitude && location && location.lat) {
        const dist = calculateDistance(rawGps.latitude, rawGps.longitude, location.lat, location.lng);

        // If distance > 100m, flag as data mismatch
        if (dist > 100) {
            validation.flags.push('GPS_DATA_MISMATCH_HIGH');
            validation.consistencyScore -= 65;
        } else if (dist > 20) {
            validation.flags.push('GPS_DATA_MISMATCH_MINOR');
            validation.consistencyScore -= 10;
        }
    } else {
        // Missing raw GPS is a data quality issue
        if (issueData.source === 'citizen') {
            validation.flags.push('MISSING_RAW_GPS_DATA');
            validation.consistencyScore -= 50;
        }
    }

    // 2. Image Metadata/Data check
    if (!imageUrl) {
        validation.flags.push('NO_IMAGE_DATA');
        validation.consistencyScore -= 80;
    } else {
        // Basic data sanity check
        if (imageUrl.length < 1000 && !imageUrl.startsWith('http')) {
            validation.flags.push('INVALID_IMAGE_DATA');
            validation.consistencyScore = 0;
            validation.isInconsistent = true;
        }
    }

    // 3. Time Consistency
    if (rawGps && rawGps.timestamp) {
        const gpsTime = new Date(rawGps.timestamp).getTime();
        const serverTime = Date.now();
        const diffHours = Math.abs(serverTime - gpsTime) / 36e5;

        if (diffHours > 24) {
            validation.flags.push('OLD_EVIDENCE_TIMESTAMP');
            validation.consistencyScore -= 30;
        }
    }

    // 4. Clamp score
    validation.consistencyScore = Math.max(0, Math.min(100, validation.consistencyScore));

    // 5. Final Consistency Verdict
    if (validation.consistencyScore < 40) {
        validation.isInconsistent = true;
    }

    return validation;
};

module.exports = { validateEvidence };
