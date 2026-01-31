/**
 * AI Verification Logic (Stage B)
 * This runs SERVER-SIDE to analyze submitted evidence.
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

const analyzeEvidence = (issueData) => {
    const analysis = {
        confidenceScore: 100,
        isFake: false,
        flags: [],
        verifiedAt: new Date()
    };

    const { rawGps, location, imageUrl } = issueData;

    // 1. GPS Consistency Check
    // If rawGps exists, check if it matches the 'location' field (which might have been user-adjusted/resolved)
    if (rawGps && rawGps.latitude && location && location.lat) {
        const dist = calculateDistance(rawGps.latitude, rawGps.longitude, location.lat, location.lng);

        // If distance > 100m, flag it
        if (dist > 100) {
            analysis.flags.push('GPS_MISMATCH_HIGH');
            analysis.confidenceScore -= 40;
        } else if (dist > 20) {
            analysis.flags.push('GPS_MISMATCH_MINOR');
            analysis.confidenceScore -= 10;
        }
    } else {
        // Missing raw GPS is suspicious for a Citizen report
        if (issueData.source === 'citizen') {
            analysis.flags.push('MISSING_RAW_GPS');
            analysis.confidenceScore -= 50;
        }
    }

    // 2. Image Metadata check (Simulated)
    // In a real system, we'd check EXIF data or run deepfake detection models
    if (!imageUrl) {
        analysis.flags.push('NO_IMAGE');
        analysis.confidenceScore -= 80;
    } else {
        // Mock check: if image string is too short (bad base64)
        if (imageUrl.length < 1000 && !imageUrl.startsWith('http')) {
            analysis.flags.push('INVALID_IMAGE_DATA');
            analysis.confidenceScore = 0;
            analysis.isFake = true;
        }
    }

    // 3. Time Consistency
    if (rawGps && rawGps.timestamp) {
        const gpsTime = new Date(rawGps.timestamp).getTime();
        const serverTime = Date.now();
        const diffHours = Math.abs(serverTime - gpsTime) / 36e5;

        if (diffHours > 24) {
            analysis.flags.push('OLD_IMAGE_TIMESTAMP');
            analysis.confidenceScore -= 30;
        }
    }

    // 4. Clamp score
    analysis.confidenceScore = Math.max(0, Math.min(100, analysis.confidenceScore));

    // 5. Final Fake Verdict
    if (analysis.confidenceScore < 40) {
        analysis.isFake = true;
    }

    return analysis;
};

module.exports = { analyzeEvidence };
