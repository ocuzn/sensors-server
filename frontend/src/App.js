// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import SensorDetailPage from './pages/SensorDetailPage';
import WeatherPage from './pages/WeatherPage';
import SensorsPage from './pages/SensorsPage';


import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sensor/:deviceId" element={<SensorDetailPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/sensors" element={<SensorsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
