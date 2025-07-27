// src/components/Navigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navigation.module.css';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link to="/" className={styles.brandLink}>
            🏠 Smart Home Dashboard
          </Link>
        </div>
        
        <div className={styles.navLinks}>
          <Link 
            to="/" 
            className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}
          >
            🏠 Home
          </Link>
          <Link
            to="/weather"
            className={`${styles.navLink} ${location.pathname === '/weather' ? styles.active : ''}`}
          >
            ☀️ Weather
          </Link>
          
          {/* Add more navigation items as your system grows */}
          <div className={styles.futureLinks}>
            {/* These will be activated as you build more features */}
            <span className={styles.comingSoon}>🌡️ Sensors</span>
            <span className={styles.comingSoon}>📊 Analytics</span>
            <span className={styles.comingSoon}>⚙️ Settings</span>
          </div>
        </div>

        <div className={styles.status}>
          <div className={styles.statusIndicator}>
            <div className={styles.statusDot}></div>
            <span className={styles.statusText}>System Online</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
