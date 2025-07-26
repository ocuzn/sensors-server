// src/utils/formatters.js
import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Format date strings
export const formatDate = (dateString, formatString = 'MMM dd, yyyy HH:mm') => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Format relative time (e.g., "5 minutes ago")
export const formatRelativeTime = (dateString) => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

// Format temperature with unit
export const formatTemperature = (value, unit = '°C', decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  return `${Number(value).toFixed(decimals)}${unit}`;
};

// Format humidity with unit
export const formatHumidity = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  return `${Number(value).toFixed(decimals)}%`;
};

// Format generic sensor value
export const formatSensorValue = (value, unit = '', decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  return `${Number(value).toFixed(decimals)}${unit ? ' ' + unit : ''}`;
};

// Get sensor type display name and unit
export const getSensorDisplayInfo = (sensorType) => {
  const sensorInfo = {
    dht_temperature: {
      name: 'Temperature',
      unit: '°C',
      color: '#ff6b6b',
      icon: '🌡️'
    },
    dht_humidity: {
      name: 'Humidity',
      unit: '%',
      color: '#4ecdc4',
      icon: '💧'
    },
    temperature: {
      name: 'Temperature',
      unit: '°C',
      color: '#ff6b6b',
      icon: '🌡️'
    },
    humidity: {
      name: 'Humidity',
      unit: '%',
      color: '#4ecdc4',
      icon: '💧'
    },
    pressure: {
      name: 'Pressure',
      unit: 'hPa',
      color: '#45b7d1',
      icon: '🌀'
    },
    light: {
      name: 'Light',
      unit: 'lux',
      color: '#f9ca24',
      icon: '💡'
    },
    co2: {
      name: 'CO₂',
      unit: 'ppm',
      color: '#6c5ce7',
      icon: '🌿'
    }
  };

  return sensorInfo[sensorType] || {
    name: sensorType.charAt(0).toUpperCase() + sensorType.slice(1),
    unit: '',
    color: '#95a5a6',
    icon: '📊'
  };
};

// Format device status
export const getDeviceStatus = (lastReading, thresholdMinutes = 5) => {
  if (!lastReading) {
    return { status: 'offline', label: 'Offline', color: '#e74c3c' };
  }

  try {
    const lastReadingDate = parseISO(lastReading);
    const minutesAgo = (Date.now() - lastReadingDate.getTime()) / (1000 * 60);

    if (minutesAgo <= thresholdMinutes) {
      return { status: 'online', label: 'Online', color: '#27ae60' };
    } else if (minutesAgo <= thresholdMinutes * 2) {
      return { status: 'warning', label: 'Delayed', color: '#f39c12' };
    } else {
      return { status: 'offline', label: 'Offline', color: '#e74c3c' };
    }
  } catch (error) {
    return { status: 'unknown', label: 'Unknown', color: '#95a5a6' };
  }
};

// Format device name for display
export const formatDeviceName = (deviceId) => {
  return deviceId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

// Generate chart colors for multiple datasets
export const generateChartColors = (count) => {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ];
  
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};
