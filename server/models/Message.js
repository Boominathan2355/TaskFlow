const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    content: {
        type: String,
        trim: true
    },
    attachment: {
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    type: {
        type: String,
        enum: ['text', 'file', 'call'],
        default: 'text'
    },
    callDuration: {
        type: Number, // in seconds
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
