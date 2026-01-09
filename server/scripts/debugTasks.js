const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const connectDB = require('../config/database');

const debugTasks = async () => {
    try {
        // Connect to Database
        await connectDB();

        console.log('Fetching all tasks...\n');

        // Find all tasks and populate project
        const tasks = await Task.find({}).populate('project').limit(10);

        console.log(`Found ${tasks.length} tasks:\n`);
        tasks.forEach((task, index) => {
            console.log(`Task ${index + 1}:`);
            console.log(`  Ticket ID: ${task._id}`);
            console.log(`  Title: ${task.title}`);
            console.log(`  Project: ${task.project?.name || 'N/A'}`);
            console.log(`  Type: ${task.type}`);
            console.log('');
        });

        // Close connection
        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

debugTasks();
