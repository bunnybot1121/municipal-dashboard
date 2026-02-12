const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');

// GET all issues
router.get('/', async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });
        res.json(issues);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single issue
router.get('/:id', async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ error: 'Issue not found' });
        res.json(issue);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { analyzeEvidence } = require('../services/aiAnalyzer');

// POST new issue
router.post('/', async (req, res) => {
    try {
        const issueData = req.body;

        // Run AI Analysis
        const analysis = analyzeEvidence(issueData);

        // Merge analysis results
        const newIssueData = {
            ...issueData,
            aiAnalysis: analysis,
            priority: analysis.priority.toLowerCase(),
            severity: analysis.priority.toLowerCase(), // Check schema compatibility
            seasonalFactor: analysis.seasonalFactor
        };

        const issue = new Issue(newIssueData);
        await issue.save();
        res.status(201).json(issue);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PATCH update issue
router.patch('/:id', async (req, res) => {
    try {
        const issue = await Issue.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!issue) return res.status(404).json({ error: 'Issue not found' });
        res.json(issue);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;