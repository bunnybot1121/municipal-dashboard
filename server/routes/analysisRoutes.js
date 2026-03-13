const express = require('express');
const router = express.Router();
const { analyzeEvidence } = require('../services/aiAnalyzer');

// POST /api/analyze - Pure Analysis Endpoint
router.post('/', async (req, res) => {
    try {
        console.log("🔍 Analyzer received request:", req.body.title);
        const issueData = req.body;

        // Run AI Analysis (Rule-Based + Generative)
        const analysis = await analyzeEvidence(issueData);

        console.log("✅ Analysis complete:", analysis.priority);
        res.json(analysis);
    } catch (error) {
        console.error("Analysis failed:", error);
        res.status(500).json({
            error: error.message,
            fallback: {
                priority: "Moderate",
                confidenceScore: 50,
                explanation: "Analysis failed due to server error."
            }
        });
    }
});

module.exports = router;
