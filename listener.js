const mqtt = require('mqtt');
const fs = require('fs');
const client = mqtt.connect('mqtt://localhost');

const dataFile = 'sensor_data.json';

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe('sensors/+/data'); // listen to all device data
});

client.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  console.log('Received:', data);

  // Append timestamp
  data.timestamp = Date.now();

  // Save to file (newline JSON)
  fs.appendFile(dataFile, JSON.stringify(data) + '\n', err => {
    if (err) console.error('Error saving data:', err);
  });
});
