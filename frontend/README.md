# Smart Home Sensor Dashboard

A React-based dashboard for monitoring IoT sensor data in real-time.

## Features

- **Real-time monitoring** - Automatic updates every 30 seconds
- **Multi-sensor support** - Temperature, humidity, and extensible for other sensor types
- **Historical charts** - Interactive charts with multiple time periods (1h, 8h, 24h, 1 week, 3 months)
- **Device management** - Overview of all connected sensors with status indicators
- **Responsive design** - Works on desktop, tablet, and mobile devices
- **Modular architecture** - Easy to extend with new sensor types and pages

## Tech Stack

- **Frontend**: React 18 with functional components and hooks
- **Charts**: Chart.js with react-chartjs-2
- **Routing**: React Router v6
- **Styling**: CSS Modules for component-scoped styles
- **API**: Axios for HTTP requests with custom hooks
- **Date handling**: date-fns for formatting and manipulation

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── SensorCard.js   # Individual sensor overview cards
│   ├── SensorChart.js  # Historical data charts
│   ├── Navigation.js   # Top navigation bar
│   └── LoadingSpinner.js # Loading indicators
├── pages/              # Page components
│   ├── HomePage.js     # Dashboard overview
│   └── SensorDetailPage.js # Detailed sensor view
├── hooks/              # Custom React hooks
│   └── useSensorData.js # Data fetching and real-time updates
├── services/           # API and external services
│   └── api.js          # Backend API communication
├── utils/              # Utility functions
│   └── formatters.js   # Data formatting helpers
└── App.js              # Main application component
```

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Make sure your backend is running**:
   - Express server should be running on `http://localhost:3000`
   - React will proxy API requests to the backend

4. **Open your browser**:
   - Navigate to `http://localhost:3001`
   - The dashboard will automatically discover and display your sensors

## API Integration

The frontend expects your Express backend to provide these endpoints:

- `GET /api/sensors` - List all sensors with metadata
- `GET /api/sensors/:deviceId/latest` - Latest reading from a sensor
- `GET /api/sensors/:deviceId/history?hours=24&limit=100` - Historical data
- `GET /api/sensors/:deviceId/sensor/:sensorType?hours=24` - Specific sensor type data
- `GET /health` - System health check

## Adding New Sensor Types

To support new sensor types (e.g., pressure, light, CO2):

1. **Update `formatters.js`**:
   ```javascript
   // Add to getSensorDisplayInfo function
   pressure: {
     name: 'Pressure',
     unit: 'hPa',
     color: '#45b7d1',
     icon: '🌀'
   }
   ```

2. **Sensor data will automatically appear** in:
   - Home page sensor cards
   - Detail page current readings
   - Chart selector dropdown

## Customization

### Styling
- Each component has its own CSS module file
- Global styles are in `App.css` and `index.css`
- Colors and spacing can be easily customized

### Real-time Updates
- Default polling interval is 30 seconds
- Modify in `useSensorData.js` hooks
- Can be easily replaced with WebSocket implementation

### Chart Configuration
- Chart.js options are in `SensorChart.js`
- Time periods configurable in `useTimePeriod` hook
- Colors and styling in `formatters.js`

## Building for Production

```bash
npm run build
```

Creates optimized production build in `build/` folder.

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)
