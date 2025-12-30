require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

const createAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@taskflow.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin account already exists.');
            process.exit(0);
        }

        const admin = new User({
            name: 'System Admin',
            email: adminEmail,
            password: 'AdminPassword123!',
            role: 'Admin',
            avatar: `https://ui-avatars.com/api/?name=System+Admin&background=0D8ABC&color=fff`
        });

        await admin.save();
        console.log('✅ Admin account created successfully!');
        console.log('📧 Credentials:');
        console.log(`   Email: ${adminEmail}`);
        console.log('   Password: AdminPassword123!');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
