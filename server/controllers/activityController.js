const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');

// Get activity logs for a project
exports.getProjectActivityLogs = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Check if user has access to this project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const hasAccess = project.owner.toString() === req.user._id.toString() ||
            project.members.some(m => m.user.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const logs = await ActivityLog.find({ project: projectId })
            .populate('user', 'name email avatar')
            .populate('task', 'title')
            .sort({ createdAt: -1 })
            .limit(100); // Limit to last 100 activities

        res.json({ logs });
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get activity logs for a specific task
exports.getTaskActivityLogs = async (req, res) => {
    try {
        const { taskId } = req.params;

        const logs = await ActivityLog.find({ task: taskId })
            .populate('user', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json({ logs });
    } catch (error) {
        console.error('Get task activity logs error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
