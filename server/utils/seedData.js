require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');

// Models
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// Sample data
const sampleUsers = [
    {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: 'password123',
        role: 'Admin',
        avatar: 'https://i.pravatar.cc/150?img=1'
    },
    {
        name: 'Mike Chen',
        email: 'mike@example.com',
        password: 'password123',
        role: 'Member',
        avatar: 'https://i.pravatar.cc/150?img=2'
    },
    {
        name: 'Emily Davis',
        email: 'emily@example.com',
        password: 'password123',
        role: 'Member',
        avatar: 'https://i.pravatar.cc/150?img=3'
    },
    {
        name: 'John Smith',
        email: 'john@example.com',
        password: 'password123',
        role: 'Viewer',
        avatar: 'https://i.pravatar.cc/150?img=4'
    }
];

const seedDatabase = async () => {
    try {
        // Connect to database
        await connectDB();

        console.log('Connected to database. Starting seed...');

        // Clear existing data
        await User.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});
        await Notification.deleteMany({});
        await ActivityLog.deleteMany({});

        console.log('Cleared existing data');

        // Create users
        const users = await User.create(sampleUsers);
        console.log(`Created ${users.length} users`);

        const [sarah, mike, emily, john] = users;

        // Create projects
        const projects = await Project.create([
            {
                title: 'Website Redesign',
                description: 'Complete overhaul of company website with modern design and improved UX',
                color: '#3B82F6',
                owner: sarah._id,
                members: [
                    { user: sarah._id, role: 'Admin' },
                    { user: mike._id, role: 'Member' },
                    { user: emily._id, role: 'Member' }
                ],
                workflowStages: ['Backlog', 'In Progress', 'Review', 'Done']
            },
            {
                title: 'Mobile App Development',
                description: 'Build cross-platform mobile app for iOS and Android',
                color: '#8B5CF6',
                owner: sarah._id,
                members: [
                    { user: sarah._id, role: 'Admin' },
                    { user: mike._id, role: 'Member' }
                ],
                workflowStages: ['Todo', 'In Progress', 'Testing', 'Deployed']
            },
            {
                title: 'Marketing Campaign Q1',
                description: 'Plan and execute Q1 marketing initiatives',
                color: '#10B981',
                owner: emily._id,
                members: [
                    { user: emily._id, role: 'Admin' },
                    { user: john._id, role: 'Viewer' }
                ],
                workflowStages: ['Planning', 'Execution', 'Review', 'Complete']
            }
        ]);

        console.log(`Created ${projects.length} projects`);

        // Create tasks
        const tasks = await Task.create([
            // Website Redesign tasks
            {
                title: 'Design new homepage mockup',
                description: 'Create high-fidelity mockup for the new homepage design',
                project: projects[0]._id,
                stage: 'Done',
                priority: 'High',
                dueDate: new Date('2025-01-15'),
                assignedTo: [emily._id],
                createdBy: sarah._id,
                comments: [
                    {
                        text: 'Looking great! Love the color scheme.',
                        author: sarah._id,
                        createdAt: new Date()
                    }
                ]
            },
            {
                title: 'Implement responsive navigation',
                description: 'Build mobile-responsive navigation component',
                project: projects[0]._id,
                stage: 'In Progress',
                priority: 'High',
                dueDate: new Date('2025-01-20'),
                assignedTo: [mike._id],
                createdBy: sarah._id
            },
            {
                title: 'Optimize images for web',
                description: 'Compress and optimize all images for better performance',
                project: projects[0]._id,
                stage: 'Backlog',
                priority: 'Medium',
                assignedTo: [emily._id],
                createdBy: sarah._id
            },
            {
                title: 'Write homepage copy',
                description: 'Create engaging copy for the new homepage',
                project: projects[0]._id,
                stage: 'Review',
                priority: 'High',
                dueDate: new Date('2025-01-18'),
                assignedTo: [emily._id],
                createdBy: sarah._id
            },

            // Mobile App tasks
            {
                title: 'Setup React Native project',
                description: 'Initialize new React Native project with necessary dependencies',
                project: projects[1]._id,
                stage: 'Done',
                priority: 'Urgent',
                assignedTo: [mike._id],
                createdBy: sarah._id
            },
            {
                title: 'Design app authentication flow',
                description: 'Create UX/UI designs for login and signup screens',
                project: projects[1]._id,
                stage: 'In Progress',
                priority: 'High',
                assignedTo: [mike._id],
                createdBy: sarah._id
            },

            // Marketing Campaign tasks
            {
                title: 'Research target audience',
                description: 'Conduct market research to identify target demographics',
                project: projects[2]._id,
                stage: 'Planning',
                priority: 'High',
                dueDate: new Date('2025-01-25'),
                assignedTo: [emily._id],
                createdBy: emily._id
            },
            {
                title: 'Create social media content calendar',
                description: 'Plan social media posts for the quarter',
                project: projects[2]._id,
                stage: 'Planning',
                priority: 'Medium',
                createdBy: emily._id
            }
        ]);

        console.log(`Created ${tasks.length} tasks`);

        // Create some activity logs
        await ActivityLog.create([
            {
                project: projects[0]._id,
                task: tasks[0]._id,
                user: sarah._id,
                action: 'task_created',
                description: 'Sarah Johnson created task "Design new homepage mockup"'
            },
            {
                project: projects[0]._id,
                task: tasks[0]._id,
                user: sarah._id,
                action: 'task_moved',
                description: 'Sarah Johnson moved "Design new homepage mockup" from In Progress to Done',
                metadata: { oldStage: 'In Progress', newStage: 'Done' }
            }
        ]);

        console.log('Created activity logs');

        // Create sample notifications
        await Notification.create([
            {
                recipient: mike._id,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: 'Sarah Johnson assigned you to "Implement responsive navigation"',
                relatedTask: tasks[1]._id,
                relatedProject: projects[0]._id,
                read: false
            },
            {
                recipient: emily._id,
                type: 'comment_added',
                title: 'New Comment',
                message: 'Sarah Johnson commented on "Design new homepage mockup"',
                relatedTask: tasks[0]._id,
                relatedProject: projects[0]._id,
                read: false
            }
        ]);

        console.log('Created sample notifications');

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📧 Sample login credentials:');
        console.log('Admin: sarah@example.com / password123');
        console.log('Member: mike@example.com / password123');
        console.log('Member: emily@example.com / password123');
        console.log('Viewer: john@example.com / password123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run seed
seedDatabase();
