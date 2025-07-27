const fetch = require('node-fetch');

async function getCurrentWeather(lat, lon) {
  // Get today's date and date 7 days from now in YYYY-MM-DD format
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 6); // 7 days including today

  const startStr = today.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  // All available daily fields from Open-Meteo docs
  const dailyFields = [
    'weathercode',
    'temperature_2m_max',
    'temperature_2m_min',
    'apparent_temperature_max',
    'apparent_temperature_min',
    'sunrise',
    'sunset',
    'precipitation_sum',
    'rain_sum',
    'showers_sum',
    'snowfall_sum',
    'precipitation_hours',
    'windspeed_10m_max',
    'windgusts_10m_max',
    'winddirection_10m_dominant',
    'shortwave_radiation_sum',
    'et0_fao_evapotranspiration',
    'uv_index_max',
    'uv_index_clear_sky_max'
  ].join(',');

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true&daily=${dailyFields}&timezone=auto&start_date=${startStr}&end_date=${endStr}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');
  const data = await res.json();

  // Return all data for flexibility
  return data;
}

module.exports = { getCurrentWeather };