// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'sensor_data.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database:', DB_PATH);
  }
});

// Initialize database schema
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create sensor_readings table
      db.run(`
        CREATE TABLE IF NOT EXISTS sensor_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          device_id TEXT NOT NULL,
          timestamp DATETIME NOT NULL,
          sensor_data JSON NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          reject(err);
        } else {
          console.log('Table "sensor_readings" created or already exists');
        }
      });

      // Create index for better query performance
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_device_timestamp 
        ON sensor_readings(device_id, timestamp DESC)
      `, (err) => {
        if (err) {
          console.error('Error creating index:', err.message);
          reject(err);
        } else {
          console.log('Index created or already exists');
          resolve();
        }
      });
    });
  });
}

// Insert sensor reading
function insertSensorReading(device_id, sensor_data) {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString();
    const sensor_data_json = JSON.stringify(sensor_data);
    
    db.run(
      'INSERT INTO sensor_readings (device_id, timestamp, sensor_data) VALUES (?, ?, ?)',
      [device_id, timestamp, sensor_data_json],
      function(err) {
        if (err) {
          console.error('Error inserting sensor reading:', err.message);
          reject(err);
        } else {
          console.log(`Inserted sensor reading with ID: ${this.lastID}`);
          resolve({
            id: this.lastID,
            device_id: device_id,
            timestamp: timestamp,
            sensor_data: sensor_data
          });
        }
      }
    );
  });
}

// Get latest reading for a device
function getLatestReading(device_id) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM sensor_readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1',
      [device_id],
      (err, row) => {
        if (err) {
          console.error('Error getting latest reading:', err.message);
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          // Parse JSON sensor_data back to object
          row.sensor_data = JSON.parse(row.sensor_data);
          resolve(row);
        }
      }
    );
  });
}

// Get all devices with stats
function getAllDevices() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        device_id,
        COUNT(*) as reading_count,
        MAX(timestamp) as last_reading,
        MIN(timestamp) as first_reading
      FROM sensor_readings 
      GROUP BY device_id 
      ORDER BY last_reading DESC
    `, (err, rows) => {
      if (err) {
        console.error('Error getting all devices:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Get historical readings for a device
function getHistoricalReadings(device_id, hours = 24, limit = 100) {
  return new Promise((resolve, reject) => {
    const hoursAgo = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    
    db.all(`
      SELECT * FROM sensor_readings 
      WHERE device_id = ? AND timestamp >= ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `, [device_id, hoursAgo, limit], (err, rows) => {
      if (err) {
        console.error('Error getting historical readings:', err.message);
        reject(err);
      } else {
        // Parse JSON sensor_data for each row
        const parsedRows = rows.map(row => ({
          ...row,
          sensor_data: JSON.parse(row.sensor_data)
        }));
        resolve(parsedRows);
      }
    });
  });
}

// Close database connection
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

// Test function to verify database operations
async function testDatabase() {
  console.log('\n=== Testing Database Operations ===');
  
  try {
    // Initialize database
    await initializeDatabase();
    
    // Test data
    const testDeviceId = 'test_device_01';
    const testSensorData = {
      device_id: testDeviceId,
      dht_temperature: 23.5,
      dht_humidity: 65.2,
      test: true
    };
    
    console.log('\n1. Testing insert...');
    const insertResult = await insertSensorReading(testDeviceId, testSensorData);
    console.log('Insert successful:', insertResult);
    
    console.log('\n2. Testing get latest reading...');
    const latestReading = await getLatestReading(testDeviceId);
    console.log('Latest reading:', latestReading);
    
    console.log('\n3. Testing get all devices...');
    const allDevices = await getAllDevices();
    console.log('All devices:', allDevices);
    
    console.log('\n4. Testing historical readings...');
    const historicalReadings = await getHistoricalReadings(testDeviceId, 1, 10);
    console.log(`Historical readings (${historicalReadings.length} found):`, historicalReadings);
    
    // Clean up test data
    console.log('\n5. Cleaning up test data...');
    db.run('DELETE FROM sensor_readings WHERE device_id = ?', [testDeviceId], (err) => {
      if (err) {
        console.error('Error cleaning up test data:', err.message);
      } else {
        console.log('Test data cleaned up');
      }
    });
    
    console.log('\n=== Database Test Complete ===');
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

// Export functions for use in other modules
module.exports = {
  db,
  initializeDatabase,
  insertSensorReading,
  getLatestReading,
  getAllDevices,
  getHistoricalReadings,
  closeDatabase,
  testDatabase
};

// If this file is run directly, run the test
if (require.main === module) {
  testDatabase().then(() => {
    // Keep the process alive for a moment to see results
    setTimeout(() => {
      closeDatabase().then(() => {
        process.exit(0);
      });
    }, 1000);
  });
}
