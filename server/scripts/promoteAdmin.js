const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

const promoteToAdmin = async () => {
    try {
        // Connect to Database
        await connectDB();

        const email = 'admin@taskflow.com';

        // Find the user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`Error: User with email ${email} not found.`);
            process.exit(1);
        }

        // Update role
        user.role = 'Admin';
        await user.save();

        console.log(`Success: User ${user.name} (${email}) has been promoted to Admin.`);

        // Close connection
        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error promoting user:', error.message);
        process.exit(1);
    }
};

promoteToAdmin();
