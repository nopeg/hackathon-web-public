import React from 'react';
import './Button.css';

interface ButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: string; 
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'contained',
  size = 'medium',
  color = '#1976d2', // Значение по умолчанию
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  children
}) => {
  const isDisabled = disabled || loading;
  
  // Стиль с динамическими переменными
  const style = {
    '--button-color': color,
    '--button-hover': darkenColor(color, 0.15), // Темнее на 15%
    '--button-active': darkenColor(color, 0.3),  // Темнее на 30%
    '--button-text': getContrastText(color)      // Автоматический контрастный текст
  } as React.CSSProperties;
  
  return (
    <button
      type={type}
      className={`
        button 
        button--${variant} 
        button--${size}
        ${fullWidth ? 'button--full-width' : ''}
        ${isDisabled ? 'button--disabled' : ''}
      `}
      style={style}
      onClick={onClick}
      disabled={isDisabled}
    >
      {loading && <span className="button__loader" />}
      {children}
    </button>
  );
};

// Функция затемнения цвета
function darkenColor(hex: string, amount: number): string {
  // Удаляем # если есть
  hex = hex.replace(/^#/, '');
  
  // Преобразуем в RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Затемняем каждый канал
  const darkenedR = Math.round(r * (1 - amount));
  const darkenedG = Math.round(g * (1 - amount));
  const darkenedB = Math.round(b * (1 - amount));
  
  // Возвращаем в HEX формате
  return `#${[
    darkenedR.toString(16).padStart(2, '0'),
    darkenedG.toString(16).padStart(2, '0'),
    darkenedB.toString(16).padStart(2, '0')
  ].join('')}`;
}

// Функция определения контрастного текста
function getContrastText(hex: string): string {
  // Удаляем # если есть
  hex = hex.replace(/^#/, '');
  
  // Преобразуем в RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Рассчитываем яркость по формуле W3C
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Возвращаем белый или черный в зависимости от яркости фона
  return brightness > 128 ? '#000000' : '#ffffff';
}

export default Button;