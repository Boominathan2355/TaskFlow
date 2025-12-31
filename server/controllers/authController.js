const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Signup validation rules
exports.signupValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Signup controller
exports.signup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Create new user - always as Member for public signup
        const user = new User({
            name,
            email,
            password,
            role: 'Member'
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
};

// Login validation rules
exports.loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

// Login controller
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};

// Refresh token
exports.refreshToken = async (req, res) => {
    try {
        const token = generateToken(req.user._id);
        res.json({ token });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const crypto = require('crypto');

const sendEmail = require('../utils/sendEmail');

// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and save to DB
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Expires in 10 minutes
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request',
                message,
                html: `
                    <h1>You have requested a password reset</h1>
                    <p>Please click the link below to reset your password:</p>
                    <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
                    <p>If you did not make this request, please ignore the email.</p>
                `
            });

            res.status(200).json({ success: true, message: 'Email sent' });
        } catch (err) {
            console.error('Email send failed. Fallback to console log.');
            console.log(`Fallback Password Reset Link: ${resetUrl}`);

            // Return success with warning so user can continue flow using console link
            return res.status(200).json({
                success: true,
                message: 'Email service unavailable. Check server console for reset link.'
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Hash token to compare with DB
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Set new password (will be hashed by pre-save hook)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        const newToken = generateToken(user._id);

        res.json({
            message: 'Password updated successfully',
            token: newToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
