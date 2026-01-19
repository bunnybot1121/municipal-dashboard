/**
 * Mock AI Verification Service
 * Simulates analyzing images for authenticity (Real vs AI-generated).
 */

export const verifyImage = async (imageUrl) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock Logic:
            // If the URL contains "ai-gen", it's flagged as AI-generated.
            // Otherwise, it's considered legitimate.

            const isAiGenerated = imageUrl.toLowerCase().includes("ai-gen");
            const confidence = isAiGenerated ? 0.95 : 0.92; // Mock high confidence

            const result = {
                imageUrl,
                isLegit: !isAiGenerated,
                confidence: confidence,
                details: isAiGenerated
                    ? "Artifacts detected consistent with generative models."
                    : "Natural noise patterns observed. content appears authentic.",
                timestamp: new Date().toISOString()
            };

            resolve(result);
        }, 1500); // Simulate processing delay
    });
};
