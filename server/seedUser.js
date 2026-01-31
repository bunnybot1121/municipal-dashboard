const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/nagarsevak_ai';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedUser = async () => {
    try {
        const username = 'admin';
        const password = 'admin123';

        // Check if exists
        const exists = await User.findOne({ username });
        if (exists) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        const admin = new User({
            username,
            password, // User model pre-save hook will hash this
            role: 'admin',
            name: 'System Administrator',
            sector: 'Headquarters'
        });

        await admin.save();
        console.log('✅ Admin user created successfully');
        console.log('Username: admin');
        console.log('Password: admin123');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding user:', err);
        process.exit(1);
    }
};

seedUser();
