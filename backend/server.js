const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Supabase
const { supabaseAdmin } = require('./config/supabase');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create upload directories if they don't exist
const fs = require('fs');
const uploadDirs = [
  'uploads/tickets',
  'uploads/documents',
  'uploads/profiles',
  'uploads/licenses'
];

uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Routes
app.use('/api/setup', require('./routes/setupRoutes'));
app.use('/api/auth', require('./routes/authRoutesSupabase'));
app.use('/api/payments', require('./routes/paymentRoutesSupabase'));
app.use('/api/dashboard', require('./routes/dashboardRoutesSupabase'));
app.use('/api/admin', require('./routes/adminFinesRoutes'));
app.use('/api/admin/subscription', require('./routes/adminSubscriptionRoutes'));
app.use('/api/fines', require('./routes/finesBrowseRoutes'));
app.use('/api/b2b', require('./routes/b2bSubscriptionRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionCheckoutRoutes'));

// Stripe webhook handler (must be before express.json())
const { handleStripeWebhook } = require('./controllers/subscriptionCheckoutController');
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), handleStripeWebhook);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: 'Supabase PostgreSQL'
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Off The Record API (Supabase)',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      payments: '/api/payments',
      dashboard: '/api/dashboard',
      health: '/health'
    }
  });
});

// Socket.IO connection handling
const userSockets = new Map(); // Map userId to socketId

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User authentication for socket
  socket.on('authenticate', (userId) => {
    userSockets.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} authenticated with socket ${socket.id}`);
  });

  // Join case room
  socket.on('joinCase', (caseId) => {
    socket.join(`case-${caseId}`);
    console.log(`Socket ${socket.id} joined case room: ${caseId}`);
  });

  // Leave case room
  socket.on('leaveCase', (caseId) => {
    socket.leave(`case-${caseId}`);
    console.log(`Socket ${socket.id} left case room: ${caseId}`);
  });

  // Handle new message
  socket.on('sendMessage', (message) => {
    // Emit to case room
    io.to(`case-${message.caseId}`).emit('newMessage', message);
    
    // Emit to specific user if they're online
    const receiverSocketId = userSockets.get(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('notification', {
        type: 'new_message',
        message: 'You have a new message',
        data: message
      });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`case-${data.caseId}`).emit('userTyping', {
      userId: socket.userId,
      isTyping: data.isTyping
    });
  });

  // Handle case status update notifications
  socket.on('caseUpdate', (update) => {
    io.to(`case-${update.caseId}`).emit('caseStatusUpdate', update);
    
    // Notify specific users
    if (update.userId) {
      const userSocketId = userSockets.get(update.userId);
      if (userSocketId) {
        io.to(userSocketId).emit('notification', {
          type: 'case_update',
          message: update.message,
          data: update
        });
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('socketio', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║                                                        ║
  ║   🚗 Off The Record API Server Running 🚗            ║
  ║                  (Supabase Edition)                   ║
  ║                                                        ║
  ║   Port: ${PORT}                                      ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                   ║
  ║   Database: Supabase PostgreSQL                       ║
  ║   URL: ${process.env.SUPABASE_URL}         ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = { app, io };
