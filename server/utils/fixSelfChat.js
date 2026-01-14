const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Chat = require('../models/Chat');
const User = require('../models/User');

dotenv.config({ path: './.env' });

const fixSelfChat = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('MongoDB Connected');

        // 1. Find the user - List all users first to debug
        const users = await User.find({});
        console.log(`Total users: ${users.length}`);
        users.forEach(u => console.log(`User: "${u.name}" (${u.email}) ID: ${u._id}`));

        let user = users.find(u => u.name === 'System Admin');
        if (!user) {
            // Try fallback if name doesn't match
            user = users[0]; // Default to first user?
            if (user) console.log(`Defaulting to first user: ${user.name}`);
        }

        if (!user) {
            console.log('No users found in DB. Aborting.');
            process.exit(1);
        }
        console.log(`Found User: ${user.name} (${user._id})`);

        // 2. Find all chats
        const chats = await Chat.find({}).sort({ updatedAt: -1 });
        console.log(`Found ${chats.length} total chats.`);

        if (chats.length === 0) {
            console.log('No chats to fix.');
            process.exit();
        }

        // 3. Keep the most recent one
        const chatToKeep = chats[0];
        console.log(`Keeping most recent chat: ${chatToKeep._id} (Updated: ${chatToKeep.updatedAt})`);

        // 4. Fix the kept chat (Ensure it's a valid self-chat)
        chatToKeep.users = [user._id];
        chatToKeep.isSelfChat = true;
        chatToKeep.isGroupChat = false;
        // chatToKeep.chatName = 'Saved Messages'; // Don't override name if it has one, or set it? 
        // User screenshot shows "System Admin", which is computed. DB name might be "sender". 
        // Let's set it to 'Saved Messages' to be clean, or leave it. 
        // Self chat logic I added: chatName is 'Saved Messages'.
        chatToKeep.chatName = 'Saved Messages';

        await chatToKeep.save();
        console.log('Repaired kept chat structure.');

        // 5. Delete duplicates
        if (chats.length > 1) {
            const chatsToDelete = chats.slice(1);
            const deleteIds = chatsToDelete.map(c => c._id);
            console.log(`Deleting ${deleteIds.length} duplicate chats: ${deleteIds.join(', ')}`);

            await Chat.deleteMany({ _id: { $in: deleteIds } });
            console.log('Deletion complete.');
        } else {
            console.log('No duplicates to delete.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixSelfChat();
