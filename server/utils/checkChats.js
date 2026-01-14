const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Chat = require('../models/Chat');

dotenv.config({ path: './.env' });

const checkChats = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log(`Connected to: ${mongoose.connection.host}/${mongoose.connection.db.databaseName}`);

        const count = await Chat.countDocuments();
        console.log(`Current Chat Count: ${count}`);

        const chats = await Chat.find({}, 'users isSelfChat isGroupChat chatName updatedAt');
        console.log(JSON.stringify(chats, null, 2));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkChats();
