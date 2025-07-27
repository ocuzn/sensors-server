// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');

// Import our modules
const { initializeDatabase, closeDatabase } = require('./config/database');
const { initializeMQTT, getMQTTStatus, closeMQTT } = require('./services/mqttClient');
const { getCurrentWeather } = require('./services/openMeteo');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const mqttStatus = getMQTTStatus();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: {
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    mqtt: mqttStatus,
    database: {
      connected: true // We'll assume DB is connected if server is running
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MQTT Sensor Data Logger API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      sensors: '/api/sensors'
    },
    timestamp: new Date().toISOString()
  });
});


// External endpoint for Open Meteo weather data
app.get('/api/weather', async (req, res) => {
  // Use query params if provided, otherwise use config defaults
  const lat = req.query.lat || config.latitude;
  const lon = req.query.lon || config.longitude;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon required' });
  }
  try {
    const weather = await getCurrentWeather(lat, lon);
    res.json({ success: true, weather });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// API Routes
app.use('/api/sensors', require('./routes/sensors'));

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Starting MQTT Sensor Data Logger...');
    
    // Initialize database
    console.log('📄 Initializing database...');
    await initializeDatabase();
    console.log('✓ Database initialized');
    
    // Initialize MQTT client
    console.log('📡 Initializing MQTT client...');
    initializeMQTT();
    console.log('✓ MQTT client initialized');
    
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API base: http://localhost:${PORT}/api`);
      console.log('🎯 Ready to receive sensor data!');
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close MQTT connection
    console.log('📡 Closing MQTT connection...');
    await closeMQTT();
    console.log('✓ MQTT connection closed');
    
    // Close database connection
    console.log('📄 Closing database connection...');
    await closeDatabase();
    console.log('✓ Database connection closed');
    
    console.log('✓ Graceful shutdown complete');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
if (require.main === module) {
  startServer();
}

// Export app for testing
module.exports = app;
