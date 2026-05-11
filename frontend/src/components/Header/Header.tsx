// src/components/Header/Header.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import Button from '../Button/Button';

interface HeaderProps {
  isAuthenticated: boolean;
  currentUser: { 
    username: string; 
    email: string;
    user_id: number;
  } | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, currentUser, onLogout}) => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__brand">
          <Button size='large' variant='text' color="#FFFFFF" onClick={() => navigate('/')}>
            Hackathon Platform
          </Button>
        </div>

        <nav className="header__navigation">
          {isAuthenticated ? (
            <div className="header__user-section">
              <div className="header__user-section__editor">
                <Button onClick={() => navigate('/editor')}>
                  Создать хакатон
                </Button>
              </div>
              <div className="header__user-section__user">
                <Button onClick={() => navigate(`/user/${currentUser?.user_id}`)}>
                  {currentUser?.username || 'Пользователь'}
                </Button>
              </div>
              <div className="header__user-section__exitr">
                <Button onClick={onLogout}>
                  Выйти
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => navigate('/auth')}>
              Вход
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;