const { validateReport } = require('./services/validationAgent.js');
const fs = require('fs');

function fileToBase64(filePath, mimeType) {
    const buffer = fs.readFileSync(filePath);
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function test() {
    try {
        console.log("Reading real image...");
        const realPhotoData = fileToBase64("./public/test_real_pothole.jpg", "image/jpeg");
        
        console.log("Testing with a likely real image...");
        const res1 = await validateReport({
            photo: realPhotoData,
            description: "There's a bus driving on a cracked road.",
            sector: "Roads",
            severity: "High"
        });
        
        fs.writeFileSync('../test_result_real.json', JSON.stringify(res1, null, 2));

        console.log("\nReading AI generated image...");
        // Placeholder, just testing if the script runs.
        const aiPhotoData = fileToBase64("./public/test_ai_2.jpg", "image/jpeg");
        console.log("Testing with an AI generated image...");
        const res2 = await validateReport({
            photo: aiPhotoData,
            description: "Cyberpunk street",
            sector: "Roads",
            severity: "Moderate"
        });
        fs.writeFileSync('../test_result_ai.json', JSON.stringify(res2, null, 2));
        
        console.log("Done. Results saved.");
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

test();
