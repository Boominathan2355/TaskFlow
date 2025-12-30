const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    stage: {
        type: String,
        required: true,
        default: 'Backlog'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    dueDate: {
        type: Date,
        default: null
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    attachments: [{
        filename: String,
        url: String,
        mimeType: String,
        size: Number,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        text: String,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Task', 'Story', 'Bug', 'Change Request', 'Epic', 'Hotfix', 'Maintenance', 'Improvement'],
        default: 'Task'
    },
    key: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for better query performance
taskSchema.index({ project: 1, stage: 1 });
taskSchema.index({ project: 1, assignedTo: 1 });

module.exports = mongoose.model('Task', taskSchema);
