const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/nagarsevak_ai';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        try {
            // 1. Delete existing admin
            await User.deleteMany({ username: 'admin' });
            console.log('Removed old admin(s).');

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
            console.log('Pass: admin123 (Testing hash: ' + admin.password.substring(0, 10) + '...)');
            process.exit(0);
        } catch (e) {
            console.error('Error during reset:', e);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Connection Error:', err);
        process.exit(1);
    });
