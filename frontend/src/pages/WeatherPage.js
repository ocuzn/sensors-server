import React, { useEffect, useState } from 'react';
import { getWeatherIcon, getWeatherSummary } from '../utils/weatherUtils';

const WeatherPage = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    fetch('/api/weather')
      .then(res => res.json())
      .then(data => {
        if (data.success) setWeather(data.weather);
        else setError(data.error || 'Failed to fetch weather');
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch weather');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading weather...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!weather?.daily) return <div>No weather data available.</div>;

  const { current_weather, daily } = weather;
  const selectedIdx = selectedDay;

  // Helper to safely get a value or fallback
  const safe = (arr, i, fallback = '-') => (Array.isArray(arr) && arr[i] !== undefined ? arr[i] : fallback);

  // Helper to render all fields for a given day index
  const renderDayDetails = (i) => (
    <div style={{
      background: '#f6f8fa',
      borderRadius: 12,
      padding: '1.5em',
      marginBottom: '2em',
      boxShadow: '0 2px 8px #0001'
    }}>
      <h3 style={{ marginTop: 0 }}>
        {i === 0 ? "Today" : (safe(daily.time, i, '') && new Date(safe(daily.time, i, '')).toLocaleDateString())}
        {" "}
        <span style={{ fontSize: '1.5em' }}>{getWeatherIcon(safe(daily.weathercode, i))}</span>
      </h3>
      <div style={{ fontSize: '1.2em', marginBottom: 8 }}>
        {getWeatherSummary(safe(daily.weathercode, i))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5em' }}>
        <div>
          <strong>Temperature:</strong><br />
          {safe(daily.temperature_2m_min, i)}°C / {safe(daily.temperature_2m_max, i)}°C
        </div>
        <div>
          <strong>Apparent Temp:</strong><br />
          {safe(daily.apparent_temperature_min, i)}°C / {safe(daily.apparent_temperature_max, i)}°C
        </div>
        <div>
          <strong>Precipitation:</strong><br />
          {safe(daily.precipitation_sum, i)} mm
        </div>
        <div>
          <strong>Wind:</strong><br />
          {safe(daily.windspeed_10m_max, i)} km/h max
        </div>
        <div>
          <strong>Sunrise/Sunset:</strong><br />
          {safe(daily.sunrise, i, '').slice(11, 16)} / {safe(daily.sunset, i, '').slice(11, 16)}
        </div>
        <div>
          <strong>UV Index:</strong><br />
          {safe(daily.uv_index_max, i)}
        </div>
        {/* Add more fields as desired */}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '2em auto', padding: '1em' }}>
      <h2 style={{ textAlign: 'center' }}>Weather Forecast</h2>
      {/* Today or selected day details */}
      {renderDayDetails(selectedIdx)}

      {/* 7-day tile view */}
      <div style={{
        display: 'flex',
        gap: '1em',
        overflowX: 'auto',
        marginBottom: '2em',
        justifyContent: 'center'
      }}>
        {Array.isArray(daily.time) && daily.time.map((date, i) => (
          <div
            key={date}
            onClick={() => setSelectedDay(i)}
            style={{
              minWidth: 110,
              cursor: 'pointer',
              background: selectedIdx === i ? '#e3eafc' : '#fff',
              border: selectedIdx === i ? '2px solid #1976d2' : '1px solid #ccc',
              borderRadius: 10,
              padding: '1em 0.5em',
              textAlign: 'center',
              boxShadow: selectedIdx === i ? '0 2px 8px #1976d233' : '0 1px 4px #0001',
              transition: 'all 0.2s'
            }}
            title={getWeatherSummary(safe(daily.weathercode, i))}
          >
            <div style={{ fontSize: '2em' }}>{getWeatherIcon(safe(daily.weathercode, i))}</div>
            <div style={{ fontWeight: 600 }}>{new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
            <div style={{ fontSize: '0.9em', color: '#555' }}>{date.slice(5)}</div>
            <div style={{ margin: '0.5em 0' }}>
              <span style={{ fontWeight: 500 }}>{safe(daily.temperature_2m_max, i)}°</span> / <span>{safe(daily.temperature_2m_min, i)}°</span>
            </div>
            <div style={{ fontSize: '0.95em', color: '#1976d2' }}>{getWeatherSummary(safe(daily.weathercode, i))}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherPage;