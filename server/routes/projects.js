const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');

// All project routes require authentication
router.use(authenticate);

// Get all projects for specific user (Admin only)
router.get('/assignments/user/:userId', projectController.getUserProjects);

// Update project assignments for user (Admin only)
router.put('/assignments/user/:userId', projectController.updateUserProjects);

// Get all projects for current user
router.get('/', projectController.getAllProjects);

// Create new project
router.post('/', projectController.createProject);

// Get project by ID
router.get('/:id', projectController.getProjectById);

// Update project
router.put('/:id', projectController.updateProject);

// Delete project
router.delete('/:id', projectController.deleteProject);

// Add member to project
router.post('/:id/members', projectController.addProjectMember);

// Remove member from project
router.delete('/:id/members', projectController.removeProjectMember);

module.exports = router;
