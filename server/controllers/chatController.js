const Chat = require('../models/Chat');
const User = require('../models/User');

// Create or fetch 1:1 chat (supports self-chat)
exports.accessChat = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "UserId param not sent with request" });
    }

    const isSelfChat = userId === req.user._id.toString();

    // Find existing chat
    let isChat;
    if (isSelfChat) {
        // For self-chat, find chat marked as isSelfChat with current user
        isChat = await Chat.find({
            isGroupChat: false,
            isSelfChat: true,
            users: { $elemMatch: { $eq: req.user._id } },
            $expr: { $eq: [{ $size: "$users" }, 1] }
        })
            .populate("users", "-password")
            .populate("latestMessage");
    } else {
        // Normal 1:1 chat
        isChat = await Chat.find({
            isGroupChat: false,
            isSelfChat: { $ne: true },
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        })
            .populate("users", "-password")
            .populate("latestMessage");
    }

    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name avatar email",
    });

    if (isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        var chatData = {
            chatName: isSelfChat ? "Saved Messages" : "sender",
            isGroupChat: false,
            isSelfChat: isSelfChat,
            users: isSelfChat ? [req.user._id] : [req.user._id, userId],
        };

        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                "users",
                "-password"
            );

            // Notify the other participant via socket (not for self-chat)
            const io = req.app.get("io");
            if (io && !isSelfChat) {
                const otherUser = FullChat.users.find(u => u._id.toString() !== req.user._id.toString());
                if (otherUser) {
                    io.to(otherUser._id.toString()).emit("new_chat_received", FullChat);
                }
            }

            res.status(200).json(FullChat);
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
};

// Fetch all chats for a user
exports.fetchChats = async (req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name avatar email",
                });
                res.status(200).send(results);
            });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

// Create Group Chat
exports.createGroupChat = async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: "Please fill all the fields" });
    }

    var users = JSON.parse(req.body.users);

    if (users.length < 2) {
        return res
            .status(400)
            .send("More than 2 users are required to form a group chat");
    }

    users.push(req.user);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        // Notify all participants via socket
        const io = req.app.get("io");
        if (io) {
            fullGroupChat.users.forEach(user => {
                if (user._id.toString() === req.user._id.toString()) return;
                io.to(user._id.toString()).emit("new_chat_received", fullGroupChat);
            });
        }

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

// Rename Group
exports.renameGroup = async (req, res) => {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName: chatName,
        },
        {
            new: true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(updatedChat);
    }
};

// Remove user from Group
exports.removeFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    // check if the requester is admin

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!removed) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(removed);
    }
};

// Add user to Group
exports.addToGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    // check if the requester is admin

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { users: userId },
        },
        {
            new: true,
        }
    )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

    if (!added) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(added);
    }
};

// Delete Chat
exports.deleteChat = async (req, res) => {
    const { chatId } = req.params;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Check if user is part of this chat
        if (!chat.users.some(u => u.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: "You are not authorized to delete this chat" });
        }

        // For group chats, only admin can delete
        if (chat.isGroupChat && chat.groupAdmin?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Only group admin can delete this chat" });
        }

        // Delete all messages in the chat
        const Message = require('../models/Message');
        await Message.deleteMany({ chat: chatId });

        // Delete the chat
        await Chat.findByIdAndDelete(chatId);

        // Notify other users via socket
        const io = req.app.get("io");
        if (io) {
            chat.users.forEach(userId => {
                io.to(userId.toString()).emit("chat_deleted", { chatId });
            });
        }

        res.status(200).json({ message: "Chat deleted successfully", chatId });
    } catch (error) {
        console.error("Delete chat error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Toggle Pin Chat
exports.togglePinChat = async (req, res) => {
    const { chatId } = req.params;

    try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Check if user is part of this chat
        if (!chat.users.some(u => u.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: "You are not authorized to pin this chat" });
        }

        const isPinned = chat.pinnedBy?.includes(req.user._id);

        if (isPinned) {
            // Unpin
            await Chat.findByIdAndUpdate(chatId, {
                $pull: { pinnedBy: req.user._id }
            });
        } else {
            // Pin
            await Chat.findByIdAndUpdate(chatId, {
                $addToSet: { pinnedBy: req.user._id }
            });
        }

        const updatedChat = await Chat.findById(chatId)
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage");

        res.status(200).json({
            message: isPinned ? "Chat unpinned" : "Chat pinned",
            chat: updatedChat,
            isPinned: !isPinned
        });
    } catch (error) {
        console.error("Toggle pin chat error:", error);
        res.status(500).json({ error: error.message });
    }
};
