const Message = require("../models/Message");
const User = require("../models/User");
const Chat = require("../models/Chat");

// Get all messages for a chat
exports.allMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name avatar email")
            .populate("chat");
        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

// Send a new message
exports.sendMessage = async (req, res) => {
    const { content, chatId, type, callDuration } = req.body;

    if (!content || !chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
        type: type || 'text',
        callDuration: callDuration || 0
    };

    try {
        var message = await Message.create(newMessage);

        message = await message.populate("sender", "name avatar");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name avatar email",
        });

        await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

        // --- Notification Logic ---
        const io = req.app.get('io');
        const chat = message.chat;
        const senderId = req.user._id.toString();

        const notifications = [];
        const recipients = new Set(); // To avoid duplicate notifications

        // 1. Check for @everyone (only in group chats)
        if (chat.isGroupChat && content.includes('@everyone')) {
            chat.users.forEach(user => {
                if (user._id.toString() !== senderId) {
                    recipients.add(user._id.toString());
                }
            });
        }

        // 2. Check for specific user mentions: @[Display Name](userId)
        // Regex to extract IDs
        const mentionRegex = /@\[.+?\]\((.+?)\)/g;
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            const mentionedUserId = match[1];
            // Verify user is in chat (basic security check) and not self
            if (mentionedUserId !== senderId && chat.users.some(u => u._id.toString() === mentionedUserId)) {
                recipients.add(mentionedUserId);
            }
        }

        // 3. Create Notifications
        const Notification = require("../models/Notification"); // Ensure Model is imported

        for (const recipientId of recipients) {
            const notification = {
                recipient: recipientId,
                type: 'mention',
                title: chat.isGroupChat ? `Mention in ${chat.chatName}` : `New message from ${req.user.name}`,
                message: `${req.user.name} mentioned you: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                link: `/chat`, // Navigate to chat page logic might need refinement on frontend to open specific chat
                relatedProject: null, // Chat doesn't directly map to project here easily, dependent on schema
                read: false
            };
            notifications.push(notification);
        }

        if (notifications.length > 0) {
            const createdNotifications = await Notification.insertMany(notifications);

            // Emit real-time events
            createdNotifications.forEach(notif => {
                // We're just sending the notification object. 
                // The client 'notification_received' (if exists) or 'new_notification' event needs to listen.
                // Assuming standard socket room for user is their ID.
                io.to(notif.recipient.toString()).emit('notification_received', notif);
            });
        }
        // --------------------------

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

// Upload file attachment
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { chatId } = req.body;

        if (!chatId) {
            return res.status(400).json({ message: "Chat ID is required" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        const newMessage = {
            sender: req.user._id,
            content: `Sent a file: ${req.file.originalname}`,
            chat: chatId,
            attachment: {
                fileName: req.file.originalname,
                fileUrl: fileUrl,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            }
        };

        let message = await Message.create(newMessage);

        message = await message.populate("sender", "name avatar");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name avatar email",
        });

        await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

        res.json(message);
    } catch (error) {
        console.error("File upload error:", error);
        res.status(400).json({ message: error.message });
    }
};
