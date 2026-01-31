const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = 'mongodb://127.0.0.1:27017/nagarsevak_ai';

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- MODELS (Defined inline for single-file simplicity in this connection phase, 
// OR imported if we create them. Prompt says "Create models...". 
// I will create them in separate files for cleanliness, but import here.)
const User = require('./models/User');
const Issue = require('./models/Issue');
const Task = require('./models/Task');
const StatusLog = require('./models/StatusLog');

// --- ROUTES ---
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 1. USERS
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2. ISSUES
app.get('/api/issues', async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const { getSeasonalPriority } = require('./utils/seasonalLogic');
const { validateEvidence } = require('./services/evidenceValidator');

app.post('/api/issues', async (req, res) => {
    try {
        const issueData = req.body;

        // Stage A: Basic Validation & Seasonal Logic
        const { factor, season, reason } = getSeasonalPriority(issueData.sector);
        issueData.seasonalFactor = factor;

        // Auto-upgrade severity if seasonal factor is high
        if (factor >= 1.5 && issueData.severity === 'Low') {
            issueData.severity = 'Medium';
            issueData.description += `\n[System Note: Priority upgraded due to ${season} season. ${reason}]`;
        } else if (factor >= 1.5) {
            issueData.description += `\n[System Note: Validated High importance due to ${season} season.]`;
        }

        // Stage B: Evidence Consistency Validation (Server-Side)
        // This runs strictly AFTER submission data is received
        const validation = validateEvidence(issueData);
        issueData.evidenceCheck = validation;

        // Log if consistency check fails
        if (validation.isInconsistent) {
            console.warn(`[CONSISTENCY ALERT] Report flagged: ${validation.flags.join(', ')}`);
            issueData.description += `\n\n[VALIDATION FLAG] Low consistency score (${validation.consistencyScore}%). Flags: ${validation.flags.join(', ')}`;
        }

        const newIssue = new Issue(issueData);
        await newIssue.save();

        res.status(201).json(newIssue);
    } catch (err) {
        console.error("Error creating issue:", err);
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/issues/:id', async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });
        res.json(issue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/issues/:id', async (req, res) => {
    try {
        const updatedIssue = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedIssue);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 3. TASKS
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().populate('issueId'); // Populate issue details
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 4. STATUS LOGS
app.get('/api/statuslogs', async (req, res) => {
    try {
        const logs = await StatusLog.find().sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/statuslogs', async (req, res) => {
    try {
        const newLog = new StatusLog(req.body);
        await newLog.save();
        res.status(201).json(newLog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
