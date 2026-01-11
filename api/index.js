// Vercel serverless function entry point
// Socket.io features are disabled in serverless mode

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('../server/routes/auth');
const userRoutes = require('../server/routes/users');
const projectRoutes = require('../server/routes/projects');
const taskRoutes = require('../server/routes/tasks');
const notificationRoutes = require('../server/routes/notifications');
const activityRoutes = require('../server/routes/activity');
const uploadRoutes = require('../server/routes/upload');
const chatRoutes = require('../server/routes/chat');
const messageRoutes = require('../server/routes/message');

// Initialize Express app
const app = express();

// MongoDB connection cache for serverless
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        console.log('Using cached database connection');
        return cachedDb;
    }

    try {
        const opts = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(process.env.MONGODB_URI, opts);
        cachedDb = mongoose.connection;
        console.log('New database connection established');
        return cachedDb;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Database connection middleware
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(503).json({
            error: 'Database connection failed',
            message: 'Unable to connect to database. Please try again later.'
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'TaskFlow API is running on Vercel',
        timestamp: new Date().toISOString(),
        environment: 'serverless',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        note: 'Real-time features (Socket.io) are not available in serverless mode'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'TaskFlow API - Serverless',
        version: '1.0.0',
        platform: 'Vercel',
        note: 'Real-time features (Socket.io) are disabled in serverless mode',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            projects: '/api/projects',
            tasks: '/api/tasks',
            notifications: '/api/notifications',
            activity: '/api/activity',
            chat: '/api/chat',
            message: '/api/message',
            health: '/api/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Export for Vercel
module.exports = app;

