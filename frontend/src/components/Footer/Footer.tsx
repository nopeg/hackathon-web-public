import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import './Footer.css';

const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__links">
          <Button 
            variant="text" 
            color="#FFFFFF"
            onClick={() => navigate('/about')}
          >
            О сайте
          </Button>
          <Button 
            variant="text" 
            color="#FFFFFF"
          >
            Контакты
          </Button>
        </div>
        <div className="footer__copyright">
          Платформа для проведения хакатонов 2025
          <div>сделал Евсеев В.Д. ИКБО-14-23</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;