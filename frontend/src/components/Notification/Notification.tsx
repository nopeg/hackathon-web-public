import { useEffect, useState } from 'react';
import './Notification.css';

type NotificationProps = {
  message: string;
  type: 'error' | 'success' | 'info';
  onClose: () => void;
  autoClose?: number;
};

const Notification = ({
  message,
  type,
  onClose,
  autoClose = 2000
}: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(handleClose, autoClose);
      return () => clearTimeout(timer);
    }
  });

  if (!isVisible) return null;

  return (
    <div className={`notification notification-${type} ${!isVisible ? 'notification-exit' : ''}`}>
      <div className="notification-content">
        {message}
        <button 
          className="notification-close"
          onClick={handleClose}
          aria-label="Закрыть уведомление"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Notification;