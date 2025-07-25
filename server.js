const express = require('express');
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Load existing data or initialize empty array
let allData = [];
try {
  const raw = fs.readFileSync(DATA_FILE);
  allData = JSON.parse(raw);
  if (!Array.isArray(allData)) {
    console.error('Data file is not an array, resetting to empty');
    allData = [];
  }
} catch (e) {
  console.log('No existing data file, starting fresh');
  allData = [];
}

// MQTT client setup
const mqttClient = mqtt.connect('mqtt://localhost'); // Adjust broker URL if needed

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  // Subscribe to all sensors topics from devices: sensors/+/data
  mqttClient.subscribe('sensors/+/data', err => {
    if (err) console.error('MQTT subscription error:', err);
  });
});

mqttClient.on('message', (topic, message) => {
  try {
    const jsonStr = message.toString();
    const data = JSON.parse(jsonStr);

    // Add timestamp if not present
    if (!data.timestamp) data.timestamp = Date.now();

    // Save data in memory
    allData.push(data);

    // Save to file asynchronously (could debounce/throttle this in real usage)
    fs.writeFile(DATA_FILE, JSON.stringify(allData, null, 2), err => {
      if (err) console.error('Error writing data file:', err);
    });

    console.log(`Received data from device ${data.device_id}`);
  } catch (e) {
    console.error('Error processing MQTT message:', e);
  }
});


app.get('/devices', (req, res) => {
  const deviceIds = [...new Set(allData.map(entry => entry.device_id))];
  res.json(deviceIds);
});

app.get('/history/:deviceId', (req, res) => {
  const deviceId = req.params.deviceId;
  const deviceData = allData.filter(entry => entry.device_id === deviceId);
  if (deviceData.length === 0) {
    return res.status(404).json({ error: 'No data found for device ' + deviceId });
  }
  res.json(deviceData);
});

// Serve static files (like your index.html + scripts/css in ./public)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
