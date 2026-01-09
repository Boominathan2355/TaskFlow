const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const connectDB = require('../config/database');

const deleteAllTasks = async () => {
    try {
        // Connect to Database
        await connectDB();

        console.log('Permanently deleting all tasks...');

        // Delete all tasks
        const taskResult = await Task.deleteMany({});
        console.log(`Success: Deleted ${taskResult.deletedCount} tasks.`);

        // Delete associated activities to keep system clean
        const activityResult = await ActivityLog.deleteMany({});
        console.log(`Success: Deleted ${activityResult.deletedCount} activities.`);

        // Close connection
        mongoose.connection.close();
        console.log('Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error deleting tasks:', error.message);
        process.exit(1);
    }
};

deleteAllTasks();
