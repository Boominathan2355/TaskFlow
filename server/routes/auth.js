const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/signup', authController.signupValidation, authController.signup);
router.post('/login', authController.loginValidation, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/refresh', authenticate, authController.refreshToken);

module.exports = router;
