// src/components/LoadingSpinner.js
import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = '#007bff', 
  message = 'Loading...',
  showMessage = true 
}) => {
  const sizeClass = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large
  };

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.spinner} ${sizeClass[size]}`}
        style={{ borderTopColor: color }}
      ></div>
      {showMessage && (
        <p className={styles.message} style={{ color }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
