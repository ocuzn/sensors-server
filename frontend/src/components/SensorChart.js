// src/components/SensorChart.js
import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { parseISO } from 'date-fns';
import { getSensorDisplayInfo } from '../utils/formatters';
import LoadingSpinner from './LoadingSpinner';
import styles from './SensorChart.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const SensorChart = ({ 
  data, 
  loading, 
  error, 
  sensorType, 
  deviceId, 
  timePeriod = '24h' 
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const sensorInfo = getSensorDisplayInfo(sensorType);
    
    // Sort data by timestamp (oldest first for proper line chart)
    const sortedData = [...data].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    return {
      labels: sortedData.map(reading => parseISO(reading.timestamp)),
      datasets: [
        {
          label: sensorInfo.name,
          data: sortedData.map(reading => ({
            x: parseISO(reading.timestamp),
            y: reading.sensor_value
          })),
          borderColor: sensorInfo.color,
          backgroundColor: sensorInfo.color + '20',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.1,
          fill: true,
        },
      ],
    };
  }, [data, sensorType]);

  const chartOptions = useMemo(() => {
    const sensorInfo = getSensorDisplayInfo(sensorType);
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            font: {
              size: 12,
            },
          },
        },
        title: {
          display: true,
          text: `${sensorInfo.name} Over Time`,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              return `${sensorInfo.name}: ${value?.toFixed(1)}${sensorInfo.unit}`;
            },
            title: function(context) {
              const date = new Date(context[0].parsed.x);
              return date.toLocaleString();
            },
          },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            displayFormats: {
              hour: 'HH:mm',
              day: 'MMM dd',
              week: 'MMM dd',
              month: 'MMM yyyy'
            },
          },
          grid: {
            display: true,
            color: '#f0f0f0',
          },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: false,
          grid: {
            display: true,
            color: '#f0f0f0',
          },
          ticks: {
            callback: function(value) {
              return `${value}${sensorInfo.unit}`;
            },
            font: {
              size: 11,
            },
          },
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
      elements: {
        point: {
          hoverBackgroundColor: sensorInfo.color,
          hoverBorderColor: '#fff',
          hoverBorderWidth: 2,
        },
      },
    };
  }, [sensorType]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner message="Loading chart data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Failed to Load Chart</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.datasets[0].data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noDataContainer}>
          <div className={styles.noDataIcon}>📊</div>
          <h3>No Data Available</h3>
          <p>No {getSensorDisplayInfo(sensorType).name.toLowerCase()} readings found for the selected time period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.chartInfo}>
        <div className={styles.dataPoints}>
          {chartData.datasets[0].data.length} data points
        </div>
        <div className={styles.timePeriod}>
          Last {timePeriod}
        </div>
      </div>
      <div className={styles.chartContainer}>
        <Line data={chartData} options={chartOptions} />
      </div>
      <div className={styles.chartFooter}>
        <div className={styles.stats}>
          {chartData.datasets[0].data.length > 0 && (
            <>
              <span className={styles.stat}>
                Min: {Math.min(...chartData.datasets[0].data.map(d => d.y)).toFixed(1)}{getSensorDisplayInfo(sensorType).unit}
              </span>
              <span className={styles.stat}>
                Max: {Math.max(...chartData.datasets[0].data.map(d => d.y)).toFixed(1)}{getSensorDisplayInfo(sensorType).unit}
              </span>
              <span className={styles.stat}>
                Avg: {(chartData.datasets[0].data.reduce((sum, d) => sum + d.y, 0) / chartData.datasets[0].data.length).toFixed(1)}{getSensorDisplayInfo(sensorType).unit}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensorChart;
