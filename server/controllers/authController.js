const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, username: user.username },
        process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
        { expiresIn: '24h' }
    );
};

exports.register = async (req, res) => {
    try {
        const { username, password, role, sector, name } = req.body;

        // Check if user exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            username,
            password,
            role,
            sector,
            name: name || username
        });

        await user.save();

        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                name: user.name,
                sector: user.sector
            }
        });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                name: user.name,
                sector: user.sector
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Check Auth Status (for frontend persistence)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
