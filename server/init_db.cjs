const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/nagarsevak_ai';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB via Mongoose');
        initDB();
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });

async function initDB() {
    const db = mongoose.connection.db;

    try {
        // Drop database to ensure fresh start (optional, but good for "Initialization" step)
        // await db.dropDatabase(); 
        // Commented out dropDatabase to be safe, instead we will creating collections if not exist

        // STEP 2: USERS COLLECTION
        console.log('--- Step 2: Users Collection ---');
        const userCount = await db.collection('users').countDocuments();
        if (userCount === 0) {
            await db.createCollection('users');
            await db.collection('users').insertMany([
                {
                    username: 'admin',
                    password: 'password123', // Plain text as requested
                    role: 'admin',
                    createdAt: new Date()
                },
                {
                    username: 'staff_roads',
                    password: 'password123',
                    role: 'staff',
                    sector: 'roads',
                    createdAt: new Date()
                }
            ]);
            console.log('Users inserted');
        } else {
            console.log('Users collection already has data');
        }

        // STEP 3: ISSUES COLLECTION
        console.log('--- Step 3: Issues Collection ---');
        const issueCount = await db.collection('issues').countDocuments();
        let sampleIssueId;

        if (issueCount === 0) {
            await db.createCollection('issues');
            const issueResult = await db.collection('issues').insertOne({
                title: 'Large Pothole on Main St',
                description: 'Deep pothole causing traffic slowdown near market',
                sector: 'roads',
                location: {
                    lat: 19.0760,
                    lng: 72.8777,
                    address: 'Main Market Road, Dadar'
                },
                severity: 'High',
                status: 'Pending',
                source: 'citizen',
                createdAt: new Date()
            });
            sampleIssueId = issueResult.insertedId;
            console.log('Sample Issue inserted with ID:', sampleIssueId);
        } else {
            const issue = await db.collection('issues').findOne({});
            sampleIssueId = issue._id;
            console.log('Using existing Issue ID:', sampleIssueId);
        }

        // STEP 4: TASKS COLLECTION
        console.log('--- Step 4: Tasks Collection ---');
        const taskCount = await db.collection('tasks').countDocuments();
        if (taskCount === 0 && sampleIssueId) {
            await db.createCollection('tasks');
            await db.collection('tasks').insertOne({
                issueId: sampleIssueId,
                assignedTo: 'staff_roads',
                department: 'Road Maintenance Dept',
                scheduledDate: '2026-01-25',
                scheduledTime: '10:00',
                status: 'Assigned',
                slaDeadline: new Date(new Date().getTime() + 48 * 60 * 60 * 1000) // +48h
            });
            console.log('Sample Task inserted');
        } else {
            console.log('Tasks collection already has data or no issue found');
        }

        // STEP 5: STATUS LOGS
        console.log('--- Step 5: Status Logs ---');
        const logCount = await db.collection('statusLogs').countDocuments();
        if (logCount === 0 && sampleIssueId) {
            await db.createCollection('statusLogs');
            await db.collection('statusLogs').insertOne({
                issueId: sampleIssueId,
                previousStatus: 'None',
                newStatus: 'Pending',
                changedBy: 'system',
                timestamp: new Date(),
                note: 'Issue reported via system'
            });
            console.log('Status Log inserted');
        } else {
            console.log('Status Logs already exist');
        }

        // STEP 6: VERIFICATION
        console.log('\n--- Step 6: Verification ---');
        const collections = await db.listCollections().toArray();
        console.log('Collections found:', collections.map(c => c.name).join(', '));

        const u = await db.collection('users').find().toArray();
        console.log(`Users count: ${u.length}`);

        const i = await db.collection('issues').find().toArray();
        console.log(`Issues count: ${i.length}`);

        const t = await db.collection('tasks').find().toArray();
        console.log(`Tasks count: ${t.length}`);

        const l = await db.collection('statusLogs').find().toArray();
        console.log(`Logs count: ${l.length}`);

        console.log('\nDatabase Initialization Complete');
        process.exit(0);

    } catch (error) {
        console.error('Initialization failed:', error);
        process.exit(1);
    }
}
