const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: '#3B82F6' // Blue
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['Admin', 'Member', 'Viewer'],
            default: 'Member'
        }
    }],
    workflowStages: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['Active', 'Archived', 'Completed'],
        default: 'Active'
    },
    keyPrefix: {
        type: String,
        uppercase: true,
        trim: true
    },
    taskCounter: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Default workflow stages and keyPrefix
projectSchema.pre('save', function (next) {
    if (this.isNew) {
        if (!this.workflowStages || this.workflowStages.length === 0) {
            this.workflowStages = ['Backlog', 'In Progress', 'Review', 'Done'];
        }

        if (!this.keyPrefix) {
            // Generate prefix from title (e.g., "Project Delta" -> "PD")
            const words = this.title.split(/\s+/).filter(w => w.length > 0);
            if (words.length >= 2) {
                this.keyPrefix = (words[0][0] + words[1][0]).toUpperCase();
            } else if (words.length === 1) {
                this.keyPrefix = words[0].substring(0, 2).toUpperCase();
            } else {
                this.keyPrefix = 'PRJ';
            }
        }
    }
    next();
});

module.exports = mongoose.model('Project', projectSchema);
