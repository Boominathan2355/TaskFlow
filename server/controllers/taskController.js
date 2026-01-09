const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// Helper to create notification
const createNotification = async (io, recipient, type, title, message, relatedTask, relatedProject) => {
    try {
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            relatedTask,
            relatedProject
        });

        // Emit real-time notification
        if (io) {
            io.to(`user_${recipient}`).emit('new_notification', notification);
        }
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Helper to create activity log
const createActivityLog = async (io, project, task, user, action, description, metadata = {}) => {
    try {
        const log = await ActivityLog.create({
            project,
            task,
            user,
            action,
            description,
            metadata
        });

        // Emit real-time activity
        if (io) {
            io.to(project.toString()).emit('new_activity', log);
        }
    } catch (error) {
        console.error('Error creating activity log:', error);
    }
};

// Get all tasks for a project
exports.getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Check if user has access to this project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // All authenticated users can view tasks of active projects
        if (project.status !== 'Active' &&
            project.owner.toString() !== req.user._id.toString() &&
            !project.members.some(m => m.user.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const tasks = await Task.find({ project: projectId })
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('comments.author', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json({ tasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all tasks assigned to the current user
exports.getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user._id })
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('project', 'title keyPrefix')
            .sort({ dueDate: 1, createdAt: -1 });

        res.json({ tasks });
    } catch (error) {
        console.error('Get my tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name email avatar')
            .populate('comments.author', 'name email avatar')
            .populate('project');

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // All authenticated users can view tasks of active projects
        const project = await Project.findById(task.project._id);
        if (project.status !== 'Active' &&
            project.owner.toString() !== req.user._id.toString() &&
            !project.members.some(m => m.user.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ task });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create new task
exports.createTask = async (req, res) => {
    try {
        const { title, description, projectId, stage, priority, dueDate, assignedTo, type } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({ error: 'Title and project are required' });
        }

        // Check if user has access to project and update task counter atomically
        const project = await Project.findByIdAndUpdate(
            projectId,
            { $inc: { taskCounter: 1 } },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const isProjectOwner = project.owner.toString() === req.user._id.toString();
        const isProjectMember = project.members.some(m => m.user.toString() === req.user._id.toString());
        const isGlobalAdmin = req.user.role === 'Admin';
        const hasAccess = isProjectOwner || isProjectMember || isGlobalAdmin;

        // Debug logging
        console.log('=== CREATE TASK ACCESS CHECK ===');
        console.log('User ID:', req.user._id.toString());
        console.log('User Role:', req.user.role);
        console.log('Project Owner:', project.owner.toString());
        console.log('Is Project Owner:', isProjectOwner);
        console.log('Is Project Member:', isProjectMember);
        console.log('Is Global Admin:', isGlobalAdmin);
        console.log('Has Access:', hasAccess);
        console.log('================================');

        if (!hasAccess || req.user.role === 'Viewer') {
            return res.status(403).json({ error: 'Access denied. You do not have permission to create tasks in this project.' });
        }

        // Generate task key (e.g., P-001)
        const taskNumber = project.taskCounter.toString().padStart(3, '0');
        const taskKey = `${project.keyPrefix || 'T'}-${taskNumber}`;

        const task = new Task({
            title,
            description: description || '',
            project: projectId,
            stage: stage || project.workflowStages[0] || 'Backlog',
            priority: priority || 'Medium',
            type: type || 'Task',
            key: taskKey,
            dueDate: dueDate || null,
            assignedTo: assignedTo || [],
            createdBy: req.user._id
        });

        await task.save();
        await task.populate('assignedTo', 'name email avatar');
        await task.populate('createdBy', 'name email avatar');

        // Create activity log
        await createActivityLog(
            req.app.get('io'),
            projectId,
            task._id,
            req.user._id,
            'task_created',
            `${req.user.name} created task "${title}"`
        );

        // Notify assigned users
        if (assignedTo && assignedTo.length > 0) {
            for (const userId of assignedTo) {
                if (userId !== req.user._id.toString()) {
                    await createNotification(
                        req.app.get('io'),
                        userId,
                        'task_assigned',
                        'New Task Assigned',
                        `You have been assigned to "${title}" by ${req.user.name}`,
                        task._id,
                        projectId
                    );
                }
            }
        }

        // Emit real-time event
        req.app.get('io').to(projectId).emit('task_created', { task, projectId });
        req.app.get('io').emit('dashboard_update'); // General update for dashboard

        res.status(201).json({
            message: 'Task created successfully',
            task
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update task
exports.updateTask = async (req, res) => {
    try {
        const { title, description, stage, priority, dueDate, assignedTo } = req.body;
        const taskId = req.params.id;

        const task = await Task.findById(taskId).populate('project');

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check if user has access
        const project = await Project.findById(task.project._id);
        const hasAccess = project.owner.toString() === req.user._id.toString() ||
            project.members.some(m => m.user.toString() === req.user._id.toString());

        if (!hasAccess || req.user.role === 'Viewer') {
            return res.status(403).json({ error: 'Access denied. Viewers cannot update tasks.' });
        }

        const oldStage = task.stage;
        const oldAssignees = task.assignedTo.map(id => id.toString());

        // Update fields
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (stage) task.stage = stage;
        if (priority) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (assignedTo !== undefined) task.assignedTo = assignedTo;

        await task.save();
        await task.populate('assignedTo', 'name email avatar');
        await task.populate('createdBy', 'name email avatar');

        // Create activity log
        let changes = [];
        if (stage && stage !== oldStage) {
            changes.push(`moved from ${oldStage} to ${stage}`);
            await createActivityLog(
                req.app.get('io'),
                task.project._id,
                task._id,
                req.user._id,
                'task_moved',
                `${req.user.name} moved "${task.title}" from ${oldStage} to ${stage}`,
                { oldStage, newStage: stage }
            );
        }

        if (changes.length === 0) {
            await createActivityLog(
                req.app.get('io'),
                task.project._id,
                task._id,
                req.user._id,
                'task_updated',
                `${req.user.name} updated task "${task.title}"`
            );
        }

        // Notify and Log newly assigned users
        if (assignedTo) {
            const newAssignees = assignedTo.filter(id => !oldAssignees.includes(id));
            for (const userId of newAssignees) {
                const assignedUser = await User.findById(userId);
                if (assignedUser) {
                    await createActivityLog(
                        req.app.get('io'),
                        task.project._id,
                        task._id,
                        req.user._id,
                        'task_assigned',
                        `${req.user.name} assigned ${assignedUser.name} to "${task.title}"`,
                        { assignedUserId: userId, assignedUserName: assignedUser.name }
                    );

                    if (userId !== req.user._id.toString()) {
                        await createNotification(
                            req.app.get('io'),
                            userId,
                            'task_assigned',
                            'New Task Assigned',
                            `You have been assigned to "${task.title}" by ${req.user.name} (${req.user.role})`,
                            task._id,
                            task.project._id
                        );
                    }
                }
            }
        }

        // Emit real-time event
        req.app.get('io').to(task.project._id.toString()).emit('task_updated', { task, projectId: task.project._id });
        req.app.get('io').emit('dashboard_update');

        res.json({
            message: 'Task updated successfully',
            task
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check if user has access (Project Owner, Project Admin, Task Creator, or Global Admin)
        const project = await Project.findById(task.project);
        const isProjectOwner = project.owner.toString() === req.user._id.toString();
        const projectMember = project.members.find(m => m.user.toString() === req.user._id.toString());
        const isProjectAdmin = projectMember && projectMember.role === 'Admin';
        const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
        const isGlobalAdmin = req.user.role === 'Admin';

        if (!isProjectOwner && !isProjectAdmin && !isTaskCreator && !isGlobalAdmin) {
            return res.status(403).json({ error: 'Access denied. You do not have permission to delete this task.' });
        }

        // Create activity log before deleting
        await createActivityLog(
            req.app.get('io'),
            task.project,
            task._id,
            req.user._id,
            'task_deleted',
            `${req.user.name} deleted task "${task.title}"`
        );

        await Task.findByIdAndDelete(taskId);

        // Emit real-time event
        req.app.get('io').to(task.project.toString()).emit('task_deleted', { taskId, projectId: task.project });
        req.app.get('io').emit('dashboard_update');

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Add comment to task
exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const taskId = req.params.id;

        if (!text) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const comment = {
            text,
            author: req.user._id,
            createdAt: new Date()
        };

        task.comments.push(comment);
        await task.save();
        await task.populate('comments.author', 'name email avatar');

        // Create activity log
        await createActivityLog(
            req.app.get('io'),
            task.project,
            task._id,
            req.user._id,
            'comment_added',
            `${req.user.name} commented on "${task.title}"`
        );

        // Notify assigned users and creator
        const notifyUsers = [...task.assignedTo, task.createdBy]
            .filter(userId => userId.toString() !== req.user._id.toString());

        for (const userId of notifyUsers) {
            await createNotification(
                req.app.get('io'),
                userId,
                'comment_added',
                'New Comment',
                `${req.user.name} commented on "${task.title}"`,
                task._id,
                task.project
            );
        }

        // Populate fields needed for frontend
        await task.populate('assignedTo', 'name email avatar');
        await task.populate('createdBy', 'name email avatar');

        // Emit real-time comment event
        req.app.get('io').to(task.project.toString()).emit('task_updated', { task, projectId: task.project });

        res.json({
            message: 'Comment added successfully',
            task,
            comment: task.comments[task.comments.length - 1]
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete comment from task
exports.deleteComment = async (req, res) => {
    try {
        const { taskId, commentId } = req.params;

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const comment = task.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Only comment author or admin can delete
        if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied. Only comment author can delete.' });
        }

        task.comments.pull(commentId);
        await task.save();

        await task.populate('assignedTo', 'name email avatar');
        await task.populate('createdBy', 'name email avatar');
        await task.populate('comments.author', 'name email avatar');

        res.json({
            message: 'Comment deleted successfully',
            task
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Add attachment to task
exports.addAttachment = async (req, res) => {
    try {
        const { filename, url, mimeType, size } = req.body;
        const taskId = req.params.id;

        if (!filename || !url) {
            return res.status(400).json({ error: 'Filename and URL are required' });
        }

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const attachment = {
            filename,
            url,
            mimeType: mimeType || 'application/octet-stream',
            size: size || 0,
            uploadedBy: req.user._id,
            uploadedAt: new Date()
        };

        task.attachments.push(attachment);
        await task.save();

        // Populate fields needed for frontend
        await task.populate('assignedTo', 'name email avatar');
        await task.populate('createdBy', 'name email avatar');
        await task.populate('comments.author', 'name email avatar');

        // Emit real-time attachment event
        req.app.get('io').to(task.project.toString()).emit('task_updated', { task, projectId: task.project });

        res.json({
            message: 'Attachment added successfully',
            task,
            attachment: task.attachments[task.attachments.length - 1]
        });
    } catch (error) {
        console.error('Add attachment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
