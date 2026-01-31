const getSeason = (date = new Date()) => {
    const month = date.getMonth(); // 0-11

    // Indian Context Seasons
    if (month === 0 || month === 1) return 'Winter'; // Jan, Feb
    if (month === 2 || month === 3) return 'Pre-Summer'; // Mar, Apr
    if (month === 4 || month === 5) return 'Summer'; // May, Jun
    if (month === 6 || month === 7 || month === 8) return 'Monsoon'; // Jul, Aug, Sep
    if (month === 9) return 'Post-Monsoon'; // Oct
    if (month === 10 || month === 11) return 'Winter'; // Nov, Dec

    return 'General';
};

const getSeasonalPriority = (sector, date = new Date()) => {
    const season = getSeason(date);
    let factor = 1.0;
    let reason = `Normal priority for ${sector} in ${season}`;

    // 1. DRAINAGE & WATER - Critical before/during Monsoon
    if ((season === 'Pre-Monsoon' || season === 'Monsoon') && (sector === 'drainage' || sector === 'water')) {
        factor = 1.5;
        reason = `Critical ${season} maintenance required for ${sector}`;
    }

    // 2. ROADS - Critical after Monsoon (potholes) and Pre-Summer
    if (season === 'Post-Monsoon' && sector === 'roads') {
        factor = 1.4;
        reason = 'Post-Monsoon road repairs are high priority';
    }

    // 3. LIGHTING - High in Winter (shorter days)
    if (season === 'Winter' && sector === 'lighting') {
        factor = 1.2;
        reason = 'Winter requires better lighting due to shorter days';
    }

    // 4. WATER - High in Summer (scarcity)
    if ((season === 'Summer' || season === 'Pre-Summer') && sector === 'water') {
        factor = 1.6;
        reason = 'Water scarcity management is critical in Summer';
    }

    return { factor, season, reason };
};

const getInspectionFrequency = (date = new Date()) => {
    const season = getSeason(date);
    // Return days interval suitable for Cron or scheduler
    if (season === 'Monsoon') return 3; // Every 3 days
    if (season === 'Pre-Monsoon') return 7; // Weekly
    if (season === 'Summer') return 5;
    return 14; // Bi-weekly default
};

module.exports = { getSeason, getSeasonalPriority, getInspectionFrequency };
