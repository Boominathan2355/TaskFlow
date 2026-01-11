require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const activityRoutes = require('./routes/activity');

const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');
const messageRoutes = require('./routes/message');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust this for production
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Socket.io connection handling
const onlineUsers = new Map(); // userId -> Set(socketIds)

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setup', (userData) => {
        const userId = userData._id || userData.id;
        socket.join(userId);

        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
            console.log('User Online:', userId);
            io.emit('user_status', { userId, status: 'online' });
        }
        onlineUsers.get(userId).add(socket.id);

        socket.emit('connected');
        socket.emit('get_online_users', Array.from(onlineUsers.keys()));
    });

    socket.on('request_online_users', () => {
        socket.emit('get_online_users', Array.from(onlineUsers.keys()));
    });

    socket.on('join_chat', (room) => {
        socket.join(room);
        console.log('User Joined Room: ' + room);
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing'));

    socket.on('new_message', (newMessageReceived) => {
        var chat = newMessageReceived.chat;

        if (!chat.users) return console.log('chat.users not defined');

        console.log(`New message in chat ${chat._id} from ${newMessageReceived.sender.name}`);

        chat.users.forEach((user) => {
            if (user._id == newMessageReceived.sender._id) return;

            console.log(`Relaying message to user: ${user._id}`);
            socket.in(user._id).emit('message_received', newMessageReceived);
        });
    });

    socket.on('join_project', (projectId) => {
        socket.join(projectId);
        console.log(`User ${socket.id} joined project: ${projectId}`);
    });

    socket.on('join_user', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined personal room: user_${userId} (socket: ${socket.id})`);
    });

    socket.on('leave_project', (projectId) => {
        socket.leave(projectId);
        console.log(`User ${socket.id} left project: ${projectId}`);
    });

    socket.on('task_action', (data) => {
        if (data.projectId) {
            socket.to(data.projectId).emit('task_action_received', {
                ...data,
                user: {
                    id: socket.id, // Or a real user ID if available
                    name: data.userName || 'Someone'
                }
            });
            console.log(`Task action ${data.action} relayed for project ${data.projectId}`);
        }
    });

    // --- WebRTC Signaling ---
    socket.on("call_user", ({ userToCall, signalData, from, name, isVideo }) => {
        io.to(userToCall).emit("call_user", { signal: signalData, from, name, isVideo });
    });

    socket.on("answer_call", (data) => {
        io.to(data.to).emit("call_accepted", data.signal);
    });

    // Mesh Network Events
    socket.on("join_room", ({ roomID, userId, name, isVideo }) => {
        // Broadcast to others in the room that a new user has joined
        // The client will then initiate peer connections to all existing members
        const clientsInRoom = io.sockets.adapter.rooms.get(roomID);
        const users = clientsInRoom ? [...clientsInRoom] : [];
        if (!users.includes(socket.id)) {
            socket.join(roomID);
        }

        socket.to(roomID).emit("user_joined", {
            signal: null, // Initial join doesn't carry signal in this mesh pattern, pure notification to trigger calls
            callerID: socket.id,
            userId,
            name,
            isVideo
        });

        // Return list of other users to the joiner so they can call them?
        // Or simpler: Joiner joins socket room. Existing users see 'user_joined', THEY call the joiner.
        // Let's use the pattern: Key is, we need to exchange signals.
        // Valid Mesh Pattern:
        // 1. User joins room.
        // 2. User emits 'join_room'.
        // 3. Server sends back list of `otherUsers` in room.
        // 4. User creates Peer for each `otherUser` (initiator: true).
        // 5. User emits `sending_signal` to each `otherUser`.
        // 6. `otherUser` receives signal, creates Peer (initiator: false), signals back.

        const otherUsers = users.filter(id => id !== socket.id);
        socket.emit("all_users", otherUsers);
    });

    socket.on("sending_signal", payload => {
        io.to(payload.userToSignal).emit('user_joined_signal', { signal: payload.signal, callerID: payload.callerID, name: payload.name, isVideo: payload.isVideo });
    });

    // Notify all users in a room that a call is starting (The "Ring")
    socket.on("ring_room", ({ roomID, callerName, isVideo }) => {
        // Broadcast to everyone in the room except the caller
        socket.to(roomID).emit("incoming_call_notification", {
            roomID,
            callerName,
            isVideo,
            from: socket.id // or userId
        });
    });

    socket.on("returning_signal", payload => {
        io.to(payload.callerID).emit('receiving_returned_signal', { signal: payload.signal, id: socket.id });
    });
    // ------------------------

    // Relay pure signal data (for ICE candidates if trickling, or re-negotiation)

    // Relay pure signal data (for ICE candidates if trickling, or re-negotiation)
    socket.on("send_signal", (data) => {
        io.to(data.userToCall).emit("received_signal", { signal: data.signal, from: data.from });
    });

    socket.on("end_call", (data) => {
        if (data && data.to) {
            io.to(data.to).emit("call_ended");
        }
    });
    // ------------------------

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let [userId, sockets] of onlineUsers.entries()) {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    console.log('User Offline:', userId);
                    io.emit('user_status', { userId, status: 'offline' });
                }
                break;
            }
        }
    });
});

// Make io available to routes
app.set('io', io);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 attachments
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Request logging middleware (development)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Project Management API is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Project Management & Workflow Tracking API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            projects: '/api/projects',
            tasks: '/api/tasks',
            notifications: '/api/notifications',
            activity: '/api/activity',
            health: '/api/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Start server (for local development)
const PORT = process.env.PORT || 5000;

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

module.exports = { app, server, io };
