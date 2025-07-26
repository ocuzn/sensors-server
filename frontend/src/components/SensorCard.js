// src/components/SensorCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSensorData } from '../hooks/useSensorData';
import { 
  formatTemperature, 
  formatHumidity, 
  formatRelativeTime, 
  getDeviceStatus,
  formatDeviceName,
  getSensorDisplayInfo
} from '../utils/formatters';
import LoadingSpinner from './LoadingSpinner';
import styles from './SensorCard.module.css';

const SensorCard = ({ deviceId }) => {
  const navigate = useNavigate();
  const { sensorData, loading, error, lastUpdated } = useSensorData(deviceId);

  const handleCardClick = () => {
    navigate(`/sensor/${deviceId}`);
  };

  if (loading) {
    return (
      <div className={styles.card}>
        <LoadingSpinner size="small" message="Loading sensor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.card} ${styles.error}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>{formatDeviceName(deviceId)}</h3>
          <span className={styles.status} style={{ color: '#e74c3c' }}>
            Error
          </span>
        </div>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (!sensorData?.latest) {
    return (
      <div className={`${styles.card} ${styles.noData}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>{formatDeviceName(deviceId)}</h3>
          <span className={styles.status} style={{ color: '#95a5a6' }}>
            No Data
          </span>
        </div>
        <p className={styles.noDataMessage}>No sensor data available</p>
      </div>
    );
  }

  const { latest } = sensorData;
  const deviceStatus = getDeviceStatus(latest.timestamp);
  const sensorValues = latest.sensor_data;

  // Extract temperature and humidity values
  const temperature = sensorValues.dht_temperature || sensorValues.temperature;
  const humidity = sensorValues.dht_humidity || sensorValues.humidity;

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.header}>
        <h3 className={styles.title}>{formatDeviceName(deviceId)}</h3>
        <span 
          className={styles.status}
          style={{ color: deviceStatus.color }}
        >
          {deviceStatus.label}
        </span>
      </div>

      <div className={styles.readings}>
        {temperature !== undefined && (
          <div className={styles.reading}>
            <div className={styles.readingIcon}>🌡️</div>
            <div className={styles.readingContent}>
              <div className={styles.readingLabel}>Temperature</div>
              <div className={styles.readingValue}>
                {formatTemperature(temperature)}
              </div>
            </div>
          </div>
        )}

        {humidity !== undefined && (
          <div className={styles.reading}>
            <div className={styles.readingIcon}>💧</div>
            <div className={styles.readingContent}>
              <div className={styles.readingLabel}>Humidity</div>
              <div className={styles.readingValue}>
                {formatHumidity(humidity)}
              </div>
            </div>
          </div>
        )}

        {/* Display other sensor types if available */}
        {Object.entries(sensorValues).map(([key, value]) => {
          if (key === 'device_id' || key.includes('temperature') || key.includes('humidity')) {
            return null;
          }

          const sensorInfo = getSensorDisplayInfo(key);
          return (
            <div key={key} className={styles.reading}>
              <div className={styles.readingIcon}>{sensorInfo.icon}</div>
              <div className={styles.readingContent}>
                <div className={styles.readingLabel}>{sensorInfo.name}</div>
                <div className={styles.readingValue}>
                  {typeof value === 'number' ? 
                    `${value.toFixed(1)}${sensorInfo.unit}` : 
                    String(value)
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <span className={styles.lastUpdated}>
          Updated {formatRelativeTime(latest.timestamp)}
        </span>
        <span className={styles.readingCount}>
          {sensorData.stats?.total_readings || 0} readings
        </span>
      </div>

      <div className={styles.clickHint}>
        Click for details →
      </div>
    </div>
  );
};

export default SensorCard;
