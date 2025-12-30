const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const { validationResult } = require('express-validator');

// Create activity log helper
const createActivityLog = async (project, user, action, description, metadata = {}) => {
    try {
        await ActivityLog.create({
            project,
            user,
            action,
            description,
            metadata
        });
    } catch (error) {
        console.error('Error creating activity log:', error);
    }
};

// Get all projects for current user
exports.getAllProjects = async (req, res) => {
    try {
        const userId = req.user._id;

        // Show all projects to all users
        const projects = await Project.find({ status: 'Active' })
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json({ projects });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // All authenticated users can view active projects
        if (project.status !== 'Active' &&
            project.owner._id.toString() !== req.user._id.toString() &&
            !project.members.some(m => m.user._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Access denied. This project is not active.' });
        }

        res.json({ project });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create new project
exports.createProject = async (req, res) => {
    try {
        const { title, description, color, workflowStages } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Project title is required' });
        }

        const project = new Project({
            title,
            description: description || '',
            color: color || '#3B82F6',
            owner: req.user._id,
            workflowStages: workflowStages || ['Backlog', 'In Progress', 'Review', 'Done'],
            members: [{
                user: req.user._id,
                role: 'Admin'
            }]
        });

        await project.save();
        await project.populate('owner', 'name email avatar');
        await project.populate('members.user', 'name email avatar');

        // Create activity log
        await createActivityLog(
            project._id,
            req.user._id,
            'project_created',
            `${req.user.name} created the project`
        );

        res.status(201).json({
            message: 'Project created successfully',
            project
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update project
exports.updateProject = async (req, res) => {
    try {
        const { title, description, color, workflowStages, status } = req.body;
        const projectId = req.params.id;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if user is owner or admin member
        const isOwner = project.owner.toString() === req.user._id.toString();
        const adminMember = project.members.find(
            m => m.user.toString() === req.user._id.toString() && m.role === 'Admin'
        );

        if (!isOwner && !adminMember && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        // Update fields
        if (title) project.title = title;
        if (description !== undefined) project.description = description;
        if (color) project.color = color;
        if (workflowStages) project.workflowStages = workflowStages;
        if (status) project.status = status;

        await project.save();
        await project.populate('owner', 'name email avatar');
        await project.populate('members.user', 'name email avatar');

        // Create activity log
        await createActivityLog(
            project._id,
            req.user._id,
            'project_updated',
            `${req.user.name} updated the project`
        );

        res.json({
            message: 'Project updated successfully',
            project
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete project
exports.deleteProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Only owner or system admin can delete
        if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied. Only owner can delete project.' });
        }

        await Project.findByIdAndDelete(projectId);

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Add member to project
exports.addProjectMember = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const projectId = req.params.id;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if requester has admin access
        const isOwner = project.owner.toString() === req.user._id.toString();
        const adminMember = project.members.find(
            m => m.user.toString() === req.user._id.toString() && m.role === 'Admin'
        );

        if (!isOwner && !adminMember) {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        // Check if user is already a member
        const existingMember = project.members.find(m => m.user.toString() === userId);
        if (existingMember) {
            return res.status(400).json({ error: 'User is already a member' });
        }

        project.members.push({
            user: userId,
            role: role || 'Member'
        });

        await project.save();
        await project.populate('members.user', 'name email avatar');

        // Create activity log
        const newMember = await require('./User').findById(userId);
        await createActivityLog(
            project._id,
            req.user._id,
            'member_added',
            `${req.user.name} added ${newMember.name} to the project`
        );

        res.json({
            message: 'Member added successfully',
            project
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Remove member from project
exports.removeProjectMember = async (req, res) => {
    try {
        const { userId } = req.body;
        const projectId = req.params.id;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if requester has admin access
        const isOwner = project.owner.toString() === req.user._id.toString();

        if (!isOwner && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Access denied. Only owner can remove members.' });
        }

        // Can't remove owner
        if (userId === project.owner.toString()) {
            return res.status(400).json({ error: 'Cannot remove project owner' });
        }

        project.members = project.members.filter(m => m.user.toString() !== userId);

        await project.save();

        res.json({
            message: 'Member removed successfully',
            project
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
