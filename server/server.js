const express = require('express');
const cors = require('cors');
const path = require('path');
// Load env from current directory ensures server/.env is read even if run from root
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
// app.use(express.static(path.join(__dirname, 'public'))); // DISABLE LEGACY FRONTEND to avoid confusion

// Database: Using Supabase (Frontend handles DB). 
// This Server currently acts as an AI / Compute Agent.

// Routes
// const authRoutes = require('./routes/authRoutes'); // LEGACY (Mongo)
// const issuesRoutes = require('./routes/issuesRoutes'); // LEGACY (Mongo)

// API Routes
app.use('/api/analyze', require('./routes/analysisRoutes'));
app.use('/api/validate', require('./routes/validationRoutes'));

// Basic Health Check & Redirect
app.get('/', (req, res) => {
    res.send('<h1>NagarSevak AI API Server</h1><p>This is the backend API. Please access the frontend at <a href="http://localhost:5173">http://localhost:5173</a></p>');
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ API Backend running on http://localhost:${PORT}`);
    console.log(`   (Processes AI requests for the frontend)`);
});