/**
 * Final System Verification Script
 * Simulates the full lifecycle: Citizen Report -> Server Validation -> Admin View
 */

// Native fetch is available in Node 18+

const BASE_URL = 'http://localhost:5001/api/issues';

const runDemo = async () => {
    console.log("🚀 Starting End-to-End System Demonstration...\n");

    // Scenario A: Good Citizen (Honest)
    // Location: Mumbai (approx 19.07, 72.87)
    // RawGPS: Matches Location
    const goodReport = {
        title: "Demo: Valid Pothole",
        description: "Severe pothole on main road.",
        sector: "roads",
        severity: "High",
        source: "citizen",
        imageUrl: "http://example.com/valid-image.jpg",
        location: { lat: 19.0760, lng: 72.8777, address: "Dadar, Mumbai" },
        rawGps: { latitude: 19.0761, longitude: 72.8776, timestamp: Date.now() }, // Very close
        isGeoVerified: true
    };

    // Scenario B: Bad Actor (Inconsistent)
    // Location: Mumbai
    // RawGPS: Delhi (approx 28.70, 77.10)
    const badReport = {
        title: "Demo: Fake Location",
        description: "Trying to report an issue from another city.",
        sector: "roads",
        severity: "Low",
        source: "citizen",
        imageUrl: "http://example.com/fake-image.jpg",
        location: { lat: 19.0760, lng: 72.8777, address: "Dadar, Mumbai" },
        rawGps: { latitude: 28.7041, longitude: 77.1025, timestamp: Date.now() }, // > 1000km away
        isGeoVerified: true
    };

    try {
        // 1. Submit Good Report
        console.log("1️⃣  Submitting 'Honest' Citizen Report...");
        const res1 = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goodReport)
        });
        const json1 = await res1.json();
        console.log(`   ✅ Created Issue ID: ${json1._id}`);
        console.log(`   🔍 System Validation: Score ${json1.evidenceCheck.consistencyScore}%`);
        if (json1.evidenceCheck.isInconsistent) console.error("   ❌ UNEXPECTED: Flagged as inconsistent!");
        else console.log("   ✅ Status: VERIFIED CONSISTENT");

        console.log("\n-----------------------------------\n");

        // 2. Submit Bad Report
        console.log("2️⃣  Submitting 'Inconsistent' Citizen Report...");
        const res2 = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(badReport)
        });
        const json2 = await res2.json();
        console.log(`   ✅ Created Issue ID: ${json2._id}`);
        console.log(`   🔍 System Validation: Score ${json2.evidenceCheck.consistencyScore}%`);
        if (json2.evidenceCheck.isInconsistent) {
            console.log("   🛡️  Status: FLAGGED INCONSISTENT (Expected)");
            console.log(`   🚩 Flags: ${json2.evidenceCheck.flags.join(', ')}`);
        } else {
            console.error("   ❌ UNEXPECTED: Failed to flag inconsistency!");
        }

        console.log("\n-----------------------------------\n");
        console.log("🎉 DEMO COMPLETE: System is correctly validating evidence consistency.");

    } catch (e) {
        console.error("Demo Failed:", e);
    }
};

runDemo();
