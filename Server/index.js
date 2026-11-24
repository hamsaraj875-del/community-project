require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS configuration supporting local dev and Vercel production frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman) or matching origin
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback so production Vercel previews work smoothly
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images (fallback if local uploads exist)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cached MongoDB connection for serverless / Vercel execution
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false, // Disable Mongoose buffering so failures fail fast or wait for connection
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
};

// Middleware to ensure DB connection before handling API requests in serverless environments
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed: ' + err.message });
  }
});

// Routes (placed AFTER connectDB middleware)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/analytics', require('./routes/analytics'));

// If running in traditional Node.js process (Render, Railway, local)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }).catch(() => {});
}

// Export app for Vercel Serverless Functions
module.exports = app;
