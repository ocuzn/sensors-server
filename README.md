# MQTT Sensor Data Logger & Dashboard

A full-stack IoT solution for logging, storing, and visualizing sensor data from devices (e.g., ESP8266) via MQTT, with a modern React dashboard frontend.

---

## Features

- **MQTT Integration:** Receives sensor data from devices via MQTT and stores it in SQLite.
- **REST API:** Provides endpoints to query devices, latest readings, historical data, and statistics.
- **React Dashboard:** Real-time, responsive dashboard for monitoring all sensors, viewing details, and exploring historical charts.
- **Extensible:** Easily add new sensor types and frontend visualizations.
- **Graceful Shutdown:** Handles process signals and cleans up resources.
- **Weather page** - 7-day forecast with detailed daily breakdown (temperature, precipitation, wind, UV, sunrise/sunset, and more)
---

## Project Structure

```
.
├── app.js                  # Main Express server entry point
├── package.json            # Backend dependencies and scripts
├── config/
│   ├── database.js         # SQLite DB logic and schema
│   └── sensor_data.db      # SQLite database file
├── routes/
│   └── sensors.js          # API routes for sensor data
├── services/
│   └── mqttClient.js       # MQTT client and message handling
└── frontend/               # React dashboard (see below)
```

### Frontend (`frontend/`)

- **React 18** with functional components and hooks
- **Chart.js** for historical data visualization
- **React Router** for navigation
- **Axios** for API calls
- **CSS Modules** for styling

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MQTT broker (e.g., Mosquitto) running at `mqtt://localhost:1883` (default)
- (Optional) ESP8266/IoT devices publishing to `sensors/{device_id}/data`

### Backend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   node app.js
   ```
   - The server listens on `http://localhost:3000`
   - Health check: [http://localhost:3000/health](http://localhost:3000/health)

3. **Environment variables (optional):**
   - `PORT`: Change server port (default: 3000)
   - `MQTT_BROKER`: MQTT broker URL (default: `mqtt://localhost:1883`)

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the React app:**
   ```bash
   npm start
   ```
   - Runs on [http://localhost:3001](http://localhost:3001) (React dev server)
   - Proxies API requests to backend

---

## API Endpoints

- `GET /api/sensors` — List all devices with stats
- `GET /api/sensors/:device_id/latest` — Latest reading for a device
- `GET /api/sensors/:device_id/history?hours=24&limit=100` — Historical readings
- `GET /api/sensors/:device_id/sensor/:sensor_type?hours=24&limit=100` — Specific sensor data
- `GET /api/sensors/:device_id/stats?hours=24` — Device statistics
- `GET /health` — Health check

---

## Adding New Sensor Types

1. **Backend:** Devices can send any JSON fields in `sensor_data`.
2. **Frontend:** Add display info in [`frontend/src/utils/formatters.js`](frontend/src/utils/formatters.js) in `getSensorDisplayInfo`.

---

## Graceful Shutdown

The server handles `SIGINT`, `SIGTERM`, uncaught exceptions, and unhandled rejections, closing MQTT and database connections cleanly.

---

## License

MIT (see `package.json`)

---
