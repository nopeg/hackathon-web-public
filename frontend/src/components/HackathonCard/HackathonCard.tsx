import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HackathonCard.css';
import { Button } from '../';

interface HackathonCardProps {
  hackathon: {
    id: number;
    title: string;
    description: string;
    image_url: string;
    start_date: string;
    max_participants: number;
  };
}

const HackathonCard: React.FC<HackathonCardProps> = ({ hackathon }) => {
  const navigate = useNavigate();
  const startDate = new Date(hackathon.start_date);

  const handleCardClick = () => {
    navigate(`/hackathon/${hackathon.id}`);
  };

  return (
    <article className="card">
      <div className="card__media">
        <img 
          src={hackathon.image_url} 
          alt={hackathon.title}
          className="card__image"
        />
      </div>
      
      <div className="card__content">
        <h3 className="card__title">{hackathon.title}</h3>
        <p className="card__description">{hackathon.description}</p>
        
        <div className="card__meta">
          <span className="card__participants">
            Участников: {hackathon.max_participants}
          </span>
        </div>
        
        <div className="card__footer">
          <span className="card__date">
            {startDate.toLocaleDateString()}
          </span>
          <Button onClick={handleCardClick}>Подробнее</Button>
        </div>
      </div>
    </article>
  );
};

export default HackathonCard;