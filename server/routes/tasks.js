const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

// All task routes require authentication
router.use(authenticate);

// Search tasks
router.get('/utility/search', taskController.searchTasks);

// Get all tasks assigned to the current user
router.get('/my-tasks', taskController.getMyTasks);

// Get tasks for a project
router.get('/project/:projectId', taskController.getProjectTasks);

// Get task by ID
router.get('/:id', taskController.getTaskById);

// Create new task
router.post('/', taskController.createTask);

// Update task
router.put('/:id', taskController.updateTask);

// Delete task
router.delete('/:id', taskController.deleteTask);

// Add comment to task
router.post('/:id/comments', taskController.addComment);

// Delete comment from task
router.delete('/:taskId/comments/:commentId', taskController.deleteComment);

// Add attachment to task
router.post('/:id/attachments', taskController.addAttachment);

// Vote on task
router.post('/:id/vote', taskController.toggleVote);

// Watch task
router.post('/:id/watch', taskController.toggleWatch);

module.exports = router;
