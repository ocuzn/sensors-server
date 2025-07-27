// src/pages/HomePage.js
import React, { useEffect, useState } from 'react';
import { useAllSensors } from '../hooks/useSensorData';
import SensorCard from '../components/SensorCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatRelativeTime } from '../utils/formatters';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [location, setLocation] = useState(null);
  const { sensors, loading, error, lastUpdated, refetch } = useAllSensors();

  useEffect(() => {
    fetch('/api/location')
      .then(res => res.json())
      .then(data => setLocation(data));
  }, []);

  const handleRefresh = () => {
    refetch();
  };

  if (loading && sensors.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" message="Loading sensors..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Location moved to top and shortened */}
      <div style={{ margin: '0.5em 0 1.5em 0', fontSize: '1.1em', color: '#1976d2', textAlign: 'center' }}>
        {location
          ? (
            <>
              📍 <strong>
                {location.short_name}
              </strong>
            </>
          )
          : <>Loading location...</>
        }
      </div>

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Smart Home Dashboard</h1>
          <p className={styles.subtitle}>
            Monitor your sensors in real-time
          </p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.lastUpdate}>
            {lastUpdated && (
              <span>Last updated {formatRelativeTime(lastUpdated)}</span>
            )}
          </div>
          <button 
            className={styles.refreshButton} 
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className={`${styles.refreshIcon} ${loading ? styles.spinning : ''}`}>
              🔄
            </span>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <div className={styles.errorContent}>
            <span className={styles.errorIcon}>⚠️</span>
            <div className={styles.errorText}>
              <strong>Error loading sensors:</strong> {error}
            </div>
            <button className={styles.retryButton} onClick={handleRefresh}>
              Retry
            </button>
          </div>
        </div>
      )}

      {sensors.length === 0 && !loading && !error ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏠</div>
          <h2 className={styles.emptyTitle}>No Sensors Found</h2>
          <p className={styles.emptyDescription}>
            No sensor devices are currently reporting data. Make sure your ESP8266 devices are connected and sending data to the MQTT broker.
          </p>
          <div className={styles.emptyActions}>
            <button className={styles.refreshButton} onClick={handleRefresh}>
              <span className={styles.refreshIcon}>🔄</span>
              Check Again
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.sensorsGrid}>
          {sensors.map((sensor) => (
            <SensorCard 
              key={sensor.device_id} 
              deviceId={sensor.device_id}
              readingCount={sensor.reading_count}
            />
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{sensors.length}</span>
            <span className={styles.statLabel}>Active Sensors</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {sensors.reduce((total, sensor) => total + (sensor.reading_count || 0), 0)}
            </span>
            <span className={styles.statLabel}>Total Readings</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {sensors.filter(sensor => {
                const lastReading = new Date(sensor.last_reading);
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                return lastReading > fiveMinutesAgo;
              }).length}
            </span>
            <span className={styles.statLabel}>Online Now</span>
          </div>
        </div>
        
        <div className={styles.systemInfo}>
          <p className={styles.systemText}>
            Smart Home Dashboard v1.0 • Real-time sensor monitoring
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
