const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

// Get all users (Admin only)
router.get('/', isAdmin, userController.getAllUsers);

// Search users
router.get('/search', userController.searchUsers);

// Create user (Admin only)
router.post('/', isAdmin, userController.createUser);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Update user role (Admin only)
router.put('/:id/role', isAdmin, userController.updateUserRole);

// Delete user (Admin only)
router.delete('/:id', isAdmin, userController.deleteUser);

module.exports = router;
