// src/components/Alert/Alert.tsx
import React from 'react';
import './Alert.css';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  children: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({ type, children }) => {
  return (
    <div className={`alert alert--${type}`}>
      {children}
    </div>
  );
};

export default Alert;