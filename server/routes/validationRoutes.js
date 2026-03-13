const express = require('express');
const router = express.Router();
const { validateReport } = require('../services/validationAgent');

// POST /api/validate — AI verification of citizen reports
router.post('/', async (req, res) => {
    try {
        const { photo, description, sector, severity } = req.body;

        if (!photo) {
            return res.status(400).json({
                isValid: false,
                confidence: 100,
                reason: "No photo provided. A photo is required to verify the report."
            });
        }

        console.log(`🔍 Validation request: sector=${sector}, severity=${severity}, desc="${(description || '').substring(0, 50)}..."`);

        const result = await validateReport({ photo, description, sector, severity });

        console.log(`✅ Validation complete: ${result.isValid ? 'ACCEPTED' : 'REJECTED'}`);
        res.json(result);

    } catch (error) {
        console.error("Validation route error:", error);
        // On server error, accept to avoid blocking citizens
        res.json({
            isValid: true,
            confidence: 30,
            reason: "Validation service error — report accepted for manual review.",
            error: error.message
        });
    }
});

module.exports = router;
