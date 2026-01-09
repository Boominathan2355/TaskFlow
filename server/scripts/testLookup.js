const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const connectDB = require('../config/database');

const testLookup = async () => {
    try {
        // Connect to Database
        await connectDB();

        const ticketId = 'AD-012';
        console.log(`Testing lookup for: ${ticketId}\n`);

        // Test the lookup logic
        const ticketRegex = /^([A-Z0-9]+)-([0-9]+)$/i;
        if (ticketRegex.test(ticketId)) {
            console.log('✓ Ticket ID format is valid');

            // Method 1: Direct key lookup (what we're using now)
            console.log('\nMethod 1: Direct key lookup');
            const task1 = await Task.findOne({ key: ticketId.toUpperCase() })
                .populate('project')
                .populate('assignedTo', 'name email avatar')
                .populate('createdBy', 'name email avatar');

            if (task1) {
                console.log('✓ Task found!');
                console.log(`  Title: ${task1.title}`);
                console.log(`  Key: ${task1.key}`);
                console.log(`  Project: ${task1.project?.name || 'N/A'}`);
            } else {
                console.log('✗ Task NOT found');
            }
        }

        // Close connection
        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

testLookup();
