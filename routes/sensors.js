// routes/sensors.js
const express = require('express');
const router = express.Router();

// Import database functions
const { 
  getAllDevices, 
  getLatestReading, 
  getHistoricalReadings,
  db 
} = require('../config/database');

// GET /api/sensors - List all devices with stats
router.get('/', async (req, res) => {
  try {
    const devices = await getAllDevices();
    
    res.json({
      success: true,
      count: devices.length,
      data: devices,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting all devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve devices',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sensors/:device_id/latest - Get latest reading for a device
router.get('/:device_id/latest', async (req, res) => {
  try {
    const deviceId = req.params.device_id;
    const latestReading = await getLatestReading(deviceId);
    
    if (!latestReading) {
      return res.status(404).json({
        success: false,
        error: 'Device not found or no readings available',
        device_id: deviceId,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: latestReading,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting latest reading:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve latest reading',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sensors/:device_id/history - Get historical readings for a device
router.get('/:device_id/history', async (req, res) => {
  try {
    const deviceId = req.params.device_id;
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 100;
    
    // Validate parameters
    if (hours <= 0 || hours > 8760) { // Max 1 year
      return res.status(400).json({
        success: false,
        error: 'Invalid hours parameter. Must be between 1 and 8760 (1 year)',
        timestamp: new Date().toISOString()
      });
    }
    
    if (limit <= 0 || limit > 10000) { // Max 10k records
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 10000',
        timestamp: new Date().toISOString()
      });
    }
    
    const historicalReadings = await getHistoricalReadings(deviceId, hours, limit);
    
    res.json({
      success: true,
      device_id: deviceId,
      count: historicalReadings.length,
      parameters: {
        hours: hours,
        limit: limit
      },
      data: historicalReadings,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting historical readings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve historical readings',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sensors/:device_id/sensor/:sensor_type - Get specific sensor data over time
router.get('/:device_id/sensor/:sensor_type', async (req, res) => {
  try {
    const deviceId = req.params.device_id;
    const sensorType = req.params.sensor_type;
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 100;
    
    // Validate parameters
    if (hours <= 0 || hours > 8760) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hours parameter. Must be between 1 and 8760 (1 year)',
        timestamp: new Date().toISOString()
      });
    }
    
    if (limit <= 0 || limit > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 10000',
        timestamp: new Date().toISOString()
      });
    }
    
    const hoursAgo = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    
    // Query for specific sensor data using SQLite JSON functions
    const query = `
      SELECT 
        id,
        device_id,
        timestamp,
        JSON_EXTRACT(sensor_data, '$.' || ?) as sensor_value,
        created_at
      FROM sensor_readings 
      WHERE device_id = ? 
        AND timestamp >= ? 
        AND JSON_EXTRACT(sensor_data, '$.' || ?) IS NOT NULL
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    
    const rows = await new Promise((resolve, reject) => {
      db.all(query, [sensorType, deviceId, hoursAgo, sensorType, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    // Convert sensor_value back to proper type (SQLite returns as string)
    const processedRows = rows.map(row => ({
      ...row,
      sensor_value: isNaN(row.sensor_value) ? row.sensor_value : parseFloat(row.sensor_value)
    }));
    
    res.json({
      success: true,
      device_id: deviceId,
      sensor_type: sensorType,
      count: processedRows.length,
      parameters: {
        hours: hours,
        limit: limit
      },
      readings: processedRows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting sensor-specific readings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sensor readings',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/sensors/:device_id/stats - Get statistics for a device
router.get('/:device_id/stats', async (req, res) => {
  try {
    const deviceId = req.params.device_id;
    const hours = parseInt(req.query.hours) || 24;
    
    const hoursAgo = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    
    // Get basic stats
    const statsQuery = `
      SELECT 
        device_id,
        COUNT(*) as total_readings,
        MIN(timestamp) as first_reading,
        MAX(timestamp) as last_reading
      FROM sensor_readings 
      WHERE device_id = ? AND timestamp >= ?
      GROUP BY device_id
    `;
    
    const stats = await new Promise((resolve, reject) => {
      db.get(statsQuery, [deviceId, hoursAgo], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'No data found for device in specified time range',
        device_id: deviceId,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      device_id: deviceId,
      time_range: {
        hours: hours,
        from: hoursAgo,
        to: new Date().toISOString()
      },
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting device stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve device statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
