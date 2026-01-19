import { verifyImage } from '../services/aiVerification.js';

/**
 * Mock Client Script
 * Simulates a client sending images to the verification module.
 */

const SAMPLE_IMAGES = [
    "https://example.com/images/pothole-real.jpg",
    "https://example.com/images/water-leak-real.png",
    "https://example.com/images/ai-gen-broken-pipe.jpg", // mocked as AI
    "https://example.com/images/park-bench.jpg",
    "https://example.com/images/deepfake-road-ai-gen.png" // mocked as AI
];

async function runSimulation() {
    console.log("Starting Image Verification Simulation...\n");
    console.log("--------------------------------------------------");

    for (const imageUrl of SAMPLE_IMAGES) {
        console.log(`Processing: ${imageUrl} ...`);

        try {
            const result = await verifyImage(imageUrl);

            // Display Results
            console.log(`[${result.isLegit ? '✅ VERIFIED' : '⚠️ ALERT'}]`);
            console.log(`   Conf: ${(result.confidence * 100).toFixed(1)}%`);
            console.log(`   Note: ${result.details}`);
        } catch (error) {
            console.error(`   Error processing image: ${error.message}`);
        }
        console.log("--------------------------------------------------");
    }

    console.log("\nSimulation Complete.");
}

runSimulation();
