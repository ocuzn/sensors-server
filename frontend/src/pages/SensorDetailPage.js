// src/pages/SensorDetailPage.js
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSensorData, useHistoricalData, useTimePeriod } from '../hooks/useSensorData';
import SensorChart from '../components/SensorChart';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  formatTemperature,
  formatHumidity,
  formatRelativeTime,
  formatDeviceName,
  getDeviceStatus,
  getSensorDisplayInfo
} from '../utils/formatters';
import styles from './SensorDetailPage.module.css';

const SensorDetailPage = () => {
  const { deviceId } = useParams();
  const { sensorData, loading: sensorLoading, error: sensorError } = useSensorData(deviceId);
  const { selectedPeriod, setSelectedPeriod, timePeriods, currentPeriod } = useTimePeriod();
  const [selectedSensorType, setSelectedSensorType] = useState('dht_temperature');

  // Get historical data for the selected sensor type and time period
  const { 
    data: historicalData, 
    loading: chartLoading, 
    error: chartError 
  } = useHistoricalData(deviceId, selectedSensorType, currentPeriod.hours);

  // Get available sensor types from the latest reading
  const availableSensorTypes = React.useMemo(() => {
    if (!sensorData?.latest?.sensor_data) return [];
    
    return Object.keys(sensorData.latest.sensor_data)
      .filter(key => key !== 'device_id' && typeof sensorData.latest.sensor_data[key] === 'number')
      .map(key => ({
        key,
        ...getSensorDisplayInfo(key)
      }));
  }, [sensorData]);

  // Set default sensor type when data loads
  React.useEffect(() => {
    if (availableSensorTypes.length > 0 && !availableSensorTypes.some(s => s.key === selectedSensorType)) {
      setSelectedSensorType(availableSensorTypes[0].key);
    }
  }, [availableSensorTypes, selectedSensorType]);

  if (sensorLoading && !sensorData) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" message="Loading sensor details..." />
        </div>
      </div>
    );
  }

  if (sensorError) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Failed to Load Sensor</h2>
          <p>{sensorError}</p>
          <Link to="/" className={styles.backButton}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!sensorData?.latest) {
    return (
      <div className={styles.container}>
        <div className={styles.noDataContainer}>
          <div className={styles.noDataIcon}>📊</div>
          <h2>No Data Available</h2>
          <p>Sensor "{deviceId}" has no available readings.</p>
          <Link to="/" className={styles.backButton}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { latest, stats } = sensorData;
  const deviceStatus = getDeviceStatus(latest.timestamp);
  const sensorValues = latest.sensor_data;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbLink}>Dashboard</Link>
          <span className={styles.breadcrumbSeparator}>→</span>
          <span className={styles.breadcrumbCurrent}>{formatDeviceName(deviceId)}</span>
        </div>
        
        <div className={styles.deviceInfo}>
          <h1 className={styles.deviceName}>{formatDeviceName(deviceId)}</h1>
          <div className={styles.deviceMeta}>
            <span 
              className={styles.deviceStatus}
              style={{ color: deviceStatus.color }}
            >
              <span className={styles.statusDot} style={{ background: deviceStatus.color }}></span>
              {deviceStatus.label}
            </span>
            <span className={styles.lastUpdate}>
              Last update: {formatRelativeTime(latest.timestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* Current Readings */}
      <div className={styles.currentReadings}>
        <h2 className={styles.sectionTitle}>Current Readings</h2>
        <div className={styles.readingsGrid}>
          {availableSensorTypes.map(({ key, name, unit, color, icon }) => {
            const value = sensorValues[key];
            return (
              <div key={key} className={styles.readingCard}>
                <div className={styles.readingIcon} style={{ color }}>
                  {icon}
                </div>
                <div className={styles.readingContent}>
                  <div className={styles.readingLabel}>{name}</div>
                  <div className={styles.readingValue}>
                    {typeof value === 'number' ? `${value.toFixed(1)}${unit}` : '--'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Controls */}
      <div className={styles.chartControls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Sensor Type:</label>
          <select
            className={styles.select}
            value={selectedSensorType}
            onChange={(e) => setSelectedSensorType(e.target.value)}
          >
            {availableSensorTypes.map(({ key, name }) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Time Period:</label>
          <div className={styles.periodButtons}>
            {Object.entries(timePeriods).map(([key, period]) => (
              <button
                key={key}
                className={`${styles.periodButton} ${selectedPeriod === key ? styles.active : ''}`}
                onClick={() => setSelectedPeriod(key)}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Chart */}
      <div className={styles.chartSection}>
        <SensorChart
          data={historicalData}
          loading={chartLoading}
          error={chartError}
          sensorType={selectedSensorType}
          deviceId={deviceId}
          timePeriod={currentPeriod.label}
        />
      </div>

      {/* Statistics */}
      {stats && (
        <div className={styles.statistics}>
          <h2 className={styles.sectionTitle}>Statistics (Last 24 Hours)</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Readings</div>
              <div className={styles.statValue}>{stats.total_readings || 0}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>First Reading</div>
              <div className={styles.statValue}>
                {stats.first_reading ? formatRelativeTime(stats.first_reading) : '--'}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Data Points</div>
              <div className={styles.statValue}>{historicalData.length}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Update Frequency</div>
              <div className={styles.statValue}>
                {stats.total_readings > 1 ? 
                  `~${Math.round(1440 / stats.total_readings)} min` : 
                  '--'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorDetailPage;
