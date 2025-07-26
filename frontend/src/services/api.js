// src/services/api.js
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions
export const sensorAPI = {
  // Get all sensors/devices
  getAllSensors: async () => {
    try {
      const response = await api.get('/sensors');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch sensors: ${error.message}`);
    }
  },

  // Get latest reading for a specific sensor
  getLatestReading: async (deviceId) => {
    try {
      const response = await api.get(`/sensors/${deviceId}/latest`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Sensor ${deviceId} not found`);
      }
      throw new Error(`Failed to fetch latest reading: ${error.message}`);
    }
  },

  // Get historical data for a sensor
  getHistoricalData: async (deviceId, hours = 24, limit = 100) => {
    try {
      const response = await api.get(`/sensors/${deviceId}/history`, {
        params: { hours, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch historical data: ${error.message}`);
    }
  },

  // Get specific sensor type data (e.g., temperature, humidity)
  getSensorTypeData: async (deviceId, sensorType, hours = 24, limit = 100) => {
    try {
      const response = await api.get(`/sensors/${deviceId}/sensor/${sensorType}`, {
        params: { hours, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch ${sensorType} data: ${error.message}`);
    }
  },

  // Get sensor statistics
  getSensorStats: async (deviceId, hours = 24) => {
    try {
      const response = await api.get(`/sensors/${deviceId}/stats`, {
        params: { hours }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch sensor stats: ${error.message}`);
    }
  },

  // Health check
  getHealthStatus: async () => {
    try {
      const response = await axios.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
};

export default api;
