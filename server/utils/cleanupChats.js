const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Chat = require('../models/Chat');

dotenv.config({ path: './.env' });

const cleanupDuplicates = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        console.log(`Using URI: ${uri ? uri.substring(0, 20) + '...' : 'undefined'}`);
        await mongoose.connect(uri);
        console.log(`MongoDB Connected to database: ${mongoose.connection.name}`);

        const totalChats = await Chat.countDocuments();
        console.log(`Total chats in DB: ${totalChats}`);

        // Find all chats with lean()
        const chats = await Chat.find({}).lean();
        console.log(`Chats found: ${chats.length}`);

        const chatGroups = {};
        const duplicates = [];

        for (const chat of chats) {
            console.log(`Chat ${chat._id}: users type=${typeof chat.users}, isArray=${Array.isArray(chat.users)}, value=${JSON.stringify(chat.users)}`);

            if (!chat.users || !Array.isArray(chat.users)) {
                console.log(`Chat ${chat._id} has invalid users property!`);
                continue;
            }
            // Create a signature for the chat based on sorted user IDs
            // Ensure IDs are strings
            const userIds = chat.users.map(id => id.toString()).sort();

            console.log(`Chat ${chat._id}: isGroup=${chat.isGroupChat}, users=[${userIds.join(', ')}], isSelfChat=${chat.isSelfChat}`);

            if (userIds.length === 0) continue;

            const signature = userIds.join('-');

            if (!chatGroups[signature]) {
                chatGroups[signature] = [];
            }
            chatGroups[signature].push(chat);
        }

        // Process duplicates
        for (const signature in chatGroups) {
            const group = chatGroups[signature];

            if (group.length > 1) {
                // Sort by updatedAt descending (keep newest)
                group.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

                // Keep the first one, delete the rest
                const toKeep = group[0];
                const toDelete = group.slice(1);

                console.log(`Found ${group.length} duplicate chats for IDs [${signature}]. Keeping ${toKeep._id} (Last updated: ${toKeep.updatedAt})`);

                for (const charToDelete of toDelete) {
                    duplicates.push(charToDelete._id);
                }
            }
        }

        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} duplicate chats to delete.`);
            const result = await Chat.deleteMany({ _id: { $in: duplicates } });
            console.log(`Deleted ${result.deletedCount} chats.`);
        } else {
            console.log('No duplicate chats found.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanupDuplicates();
