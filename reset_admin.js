const mongoose = require('mongoose');
const User = require('./server/models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/nagarsevak_ai';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        // 1. Delete existing admin
        await User.deleteOne({ username: 'admin' });
        console.log('Removed old admin.');

        // 2. Create new hashed admin
        const admin = new User({
            username: 'admin',
            password: 'admin123', // Will be hashed by pre-save
            role: 'admin',
            name: 'System Administrator',
            sector: 'Headquarters'
        });

        await admin.save();
        console.log('✅ Admin user reset successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
