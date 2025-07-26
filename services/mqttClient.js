// mqttClient.js
const mqtt = require('mqtt');
const { insertSensorReading, initializeDatabase } = require('../config/database');

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const MQTT_TOPIC = 'sensors/+/data';

// MQTT Client
let mqttClient = null;

// Initialize MQTT client
function initializeMQTT() {
  console.log(`Connecting to MQTT broker: ${MQTT_BROKER}`);
  
  mqttClient = mqtt.connect(MQTT_BROKER, {
    // Connection options
    keepalive: 60,
    connectTimeout: 30 * 1000, // 30 seconds
    reconnectPeriod: 1000, // 1 second
    clean: true,
    clientId: `sensor-logger-${Math.random().toString(16).substr(2, 8)}`
  });

  // Connection successful
  mqttClient.on('connect', () => {
    console.log('✓ Connected to MQTT broker');
    
    // Subscribe to sensor data topics
    mqttClient.subscribe(MQTT_TOPIC, { qos: 0 }, (err) => {
      if (err) {
        console.error('Failed to subscribe to MQTT topic:', err);
      } else {
        console.log(`✓ Subscribed to topic: ${MQTT_TOPIC}`);
      }
    });
  });

  // Handle incoming messages
  mqttClient.on('message', handleMQTTMessage);

  // Connection error
  mqttClient.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });

  // Disconnection
  mqttClient.on('close', () => {
    console.log('MQTT connection closed');
  });

  // Reconnecting
  mqttClient.on('reconnect', () => {
    console.log('Attempting to reconnect to MQTT broker...');
  });

  // Offline
  mqttClient.on('offline', () => {
    console.log('MQTT client is offline');
  });

  return mqttClient;
}

// Handle incoming MQTT messages
async function handleMQTTMessage(topic, message) {
  try {
    console.log(`\n--- Received MQTT Message ---`);
    console.log(`Topic: ${topic}`);
    console.log(`Message: ${message.toString()}`);
    
    // Extract device_id from topic: sensors/device_id/data
    const topicParts = topic.split('/');
    if (topicParts.length !== 3 || topicParts[0] !== 'sensors' || topicParts[2] !== 'data') {
      console.error('Invalid topic format. Expected: sensors/{device_id}/data');
      return;
    }
    
    const deviceId = topicParts[1];
    console.log(`Device ID: ${deviceId}`);
    
    // Parse JSON message
    let sensorData;
    try {
      sensorData = JSON.parse(message.toString());
    } catch (parseError) {
      console.error('Failed to parse JSON message:', parseError.message);
      console.error('Raw message:', message.toString());
      return;
    }
    
    console.log('Parsed sensor data:', sensorData);
    
    // Store in database
    try {
      const result = await insertSensorReading(deviceId, sensorData);
      console.log('✓ Successfully stored in database:', result.id);
    } catch (dbError) {
      console.error('Failed to store in database:', dbError.message);
    }
    
    console.log('--- Message Processing Complete ---\n');
    
  } catch (error) {
    console.error('Error processing MQTT message:', error.message);
    console.error('Topic:', topic);
    console.error('Message:', message.toString());
  }
}

// Get MQTT client status
function getMQTTStatus() {
  if (!mqttClient) {
    return { connected: false, status: 'not_initialized' };
  }
  
  return {
    connected: mqttClient.connected,
    status: mqttClient.connected ? 'connected' : 'disconnected',
    broker: MQTT_BROKER,
    topic: MQTT_TOPIC
  };
}

// Publish message (for future use - sending commands to devices)
function publishMessage(topic, message) {
  return new Promise((resolve, reject) => {
    if (!mqttClient || !mqttClient.connected) {
      reject(new Error('MQTT client not connected'));
      return;
    }
    
    mqttClient.publish(topic, message, { qos: 0 }, (err) => {
      if (err) {
        console.error('Failed to publish message:', err);
        reject(err);
      } else {
        console.log(`Message published to ${topic}:`, message);
        resolve();
      }
    });
  });
}

// Close MQTT connection
function closeMQTT() {
  return new Promise((resolve) => {
    if (mqttClient) {
      mqttClient.end(false, () => {
        console.log('MQTT connection closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Test function
async function testMQTT() {
  console.log('\n=== Testing MQTT Client ===');
  
  try {
    // Initialize database first
    await initializeDatabase();
    console.log('Database initialized');
    
    // Initialize MQTT
    const client = initializeMQTT();
    
    // Wait for connection
    client.on('connect', () => {
      console.log('MQTT test connection established');
      
      // Simulate sending a test message after 2 seconds
      setTimeout(() => {
        console.log('\nSending test message...');
        const testTopic = 'sensors/test_device/data';
        const testMessage = JSON.stringify({
          device_id: 'test_device',
          dht_temperature: 25.3,
          dht_humidity: 60.5,
          timestamp: new Date().toISOString(),
          test: true
        });
        
        client.publish(testTopic, testMessage, (err) => {
          if (err) {
            console.error('Failed to send test message:', err);
          } else {
            console.log('Test message sent successfully');
          }
        });
      }, 2000);
      
      // Close after 10 seconds
      setTimeout(() => {
        console.log('\nClosing test connection...');
        closeMQTT().then(() => {
          console.log('=== MQTT Test Complete ===');
          process.exit(0);
        });
      }, 10000);
    });
    
  } catch (error) {
    console.error('MQTT test failed:', error);
    process.exit(1);
  }
}

// Export functions
module.exports = {
  initializeMQTT,
  getMQTTStatus,
  publishMessage,
  closeMQTT,
  testMQTT
};

// If this file is run directly, run the test
if (require.main === module) {
  testMQTT();
}
