const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Load .env
const connectDB = require('./config/db');

const bookingRoutes = require('./routes/bookings');
const ownerRoutes = require('./routes/owner');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

const mongoose = require('mongoose'); // Import mongoose

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

// Health Check Middleware - Fail fast if DB is not connected
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database not connected. Please check server logs for connection status.' });
    }
    next();
});

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/owner', ownerRoutes);

// Server Start
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
