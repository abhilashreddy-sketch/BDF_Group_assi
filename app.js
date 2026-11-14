const express = require('express');
const cors = require('cors');
require('dotenv').config();

const hallRoutes = require('./routes/hallRoutes');
const organiserRoutes = require('./routes/organiserRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Root Index Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Welcome to EventSpark Hall API",
    project: "EventSpark Hall",
    status: "Running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      halls: "/halls",
      organisers: "/organisers",
      bookings: "/bookings",
      bookingDetails: "/bookings/details"
    }
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'EventSpark Hall Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Resource Routes
app.use('/halls', hallRoutes);
app.use('/organisers', organiserRoutes);
app.use('/bookings', bookingRoutes);

// Catch-all 404 handler for undefined routes
app.use(notFound);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
