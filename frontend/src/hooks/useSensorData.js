// src/hooks/useSensorData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { sensorAPI } from '../services/api';

// Custom hook for fetching all sensors with real-time updates
export const useAllSensors = (refreshInterval = 30000) => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchSensors = useCallback(async () => {
    try {
      setError(null);
      const response = await sensorAPI.getAllSensors();
      setSensors(response.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching sensors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchSensors, refreshInterval);
  }, [fetchSensors, refreshInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchSensors();
  }, [fetchSensors]);

  useEffect(() => {
    fetchSensors();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchSensors, startPolling, stopPolling]);

  return {
    sensors,
    loading,
    error,
    lastUpdated,
    refetch,
    startPolling,
    stopPolling
  };
};

// Custom hook for fetching individual sensor data with real-time updates
export const useSensorData = (deviceId, refreshInterval = 30000) => {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchSensorData = useCallback(async () => {
    if (!deviceId) return;

    try {
      setError(null);
      const [latestResponse, statsResponse] = await Promise.all([
        sensorAPI.getLatestReading(deviceId),
        sensorAPI.getSensorStats(deviceId, 24).catch(() => null) // Don't fail if stats unavailable
      ]);

      setSensorData({
        latest: latestResponse.data,
        stats: statsResponse?.data?.statistics || null
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching sensor data:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchSensorData, refreshInterval);
  }, [fetchSensorData, refreshInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchSensorData();
  }, [fetchSensorData]);

  useEffect(() => {
    if (deviceId) {
      fetchSensorData();
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [deviceId, fetchSensorData, startPolling, stopPolling]);

  return {
    sensorData,
    loading,
    error,
    lastUpdated,
    refetch,
    startPolling,
    stopPolling
  };
};

// Custom hook for fetching historical sensor data
export const useHistoricalData = (deviceId, sensorType, hours = 24) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!deviceId || !sensorType) return;

    setLoading(true);
    try {
      setError(null);
      const response = await sensorAPI.getSensorTypeData(deviceId, sensorType, hours, 500);
      setData(response.readings || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching historical data:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId, sensorType, hours]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

// Custom hook for managing chart time periods
export const useTimePeriod = (defaultPeriod = '24h') => {
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);

  const timePeriods = {
    '1h': { label: '1 Hour', hours: 1 },
    '8h': { label: '8 Hours', hours: 8 },
    '24h': { label: '24 Hours', hours: 24 },
    '7d': { label: '1 Week', hours: 168 },
    '3m': { label: '3 Months', hours: 2160 }
  };

  const currentPeriod = timePeriods[selectedPeriod];

  return {
    selectedPeriod,
    setSelectedPeriod,
    timePeriods,
    currentPeriod
  };
};
