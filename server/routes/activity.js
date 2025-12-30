const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

// All activity routes require authentication
router.use(authenticate);

// Get activity logs for a project
router.get('/project/:projectId', activityController.getProjectActivityLogs);

// Get activity logs for a task
router.get('/task/:taskId', activityController.getTaskActivityLogs);

module.exports = router;
