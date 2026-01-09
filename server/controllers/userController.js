const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ users });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { name, email, avatar } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Only allow user to update their own profile, unless admin
        if (req.user.role !== 'Admin' && req.user._id.toString() !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check for email conflicts
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (avatar !== undefined) user.avatar = avatar;

        await user.save();

        res.json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update user role (Admin only)
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!['Admin', 'Member', 'Viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent modifying super admin role
        if (user.email === 'admin@taskflow.com') {
            return res.status(403).json({ error: 'Super Admin role cannot be modified' });
        }

        user.role = role;
        await user.save();

        res.json({
            message: 'User role updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });

        // Emit real-time updates
        req.app.get('io').emit('user_updated', { user });
        req.app.get('io').emit('dashboard_update');
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (req.user._id.toString() === userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting super admin
        if (user.email === 'admin@taskflow.com') {
            return res.status(403).json({ error: 'Super Admin account cannot be deleted' });
        }

        await User.findByIdAndDelete(userId);

        // Emit real-time event
        req.app.get('io').emit('user_deleted', { userId });
        req.app.get('io').emit('dashboard_update');

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create user (Admin only)
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const user = new User({
            name,
            email,
            password,
            role: role || 'Member'
        });

        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });

        // Emit real-time updates
        req.app.get('io').emit('user_created', { user });
        req.app.get('io').emit('dashboard_update');
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
