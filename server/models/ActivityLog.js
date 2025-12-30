const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'project_created',
            'project_updated',
            'task_created',
            'task_updated',
            'task_deleted',
            'task_moved',
            'comment_added',
            'member_added',
            'member_removed',
            'stage_changed',
            'task_assigned'
        ]
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for faster queries
activityLogSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
