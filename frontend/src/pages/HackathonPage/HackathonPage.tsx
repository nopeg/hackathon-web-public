import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHackathonById, joinHackathon } from '../../services/apiService';
import { Hackathon } from '../../types/types';
import Button from '../../components/Button/Button';
import Notification from '../../components/Notification/Notification';
import './HackathonPage.css';

const HackathonPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [timerPhase, setTimerPhase] = useState<'before-registration' | 'registration' | 'hackathon' | 'ended'>('before-registration');
  const [isJoining, setIsJoining] = useState(false);
  const [creatorName, setCreatorName] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success' | 'info'} | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        const data = await getHackathonById(Number(id));
        setHackathon(data);
        
        if (isAuthenticated) {
          checkParticipation(data.id);
        }

        try {
          const creator = "bob";
          setCreatorName(creator);
        } catch (err) {
          console.error('Failed to fetch creator:', err);
          setCreatorName('Организатор');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHackathon();
  }, [id, isAuthenticated]);

  const checkParticipation = async (hackathonId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const isParticipating = false;
      setIsParticipant(isParticipating);
    } catch (err) {
      console.error('Failed to check participation:', err);
    }
  };

  useEffect(() => {
    if (!hackathon) return;

    const updateTimer = () => {
      const now = new Date();
      const registrationStart = new Date(hackathon.registration_start);
      const startDate = new Date(hackathon.start_date);
      const endDate = new Date(hackathon.end_date);

      if (now < registrationStart) {
        setTimerPhase('before-registration');
        const diff = registrationStart.getTime() - now.getTime();
        setTimeLeft(formatTime(diff));
      } else if (now >= registrationStart && now < startDate) {
        setTimerPhase('registration');
        const diff = startDate.getTime() - now.getTime();
        setTimeLeft(formatTime(diff));
      } else if (now >= startDate && now < endDate) {
        setTimerPhase('hackathon');
        const diff = endDate.getTime() - now.getTime();
        setTimeLeft(formatTime(diff));
      } else {
        setTimerPhase('ended');
        setTimeLeft('Хакатон завершен');
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);

    return () => clearInterval(timerId);
  }, [hackathon]);

  const formatTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return '00:00:00';

    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

    if (days > 0) {
      let dayWord;
      if (days % 100 >= 11 && days % 100 <= 14) {
        dayWord = 'дней';
      } else {
        switch (days % 10) {
          case 1: dayWord = 'день'; break;
          case 2:
          case 3:
          case 4: dayWord = 'дня'; break;
          default: dayWord = 'дней';
        }
      }
      return `${days} ${dayWord} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerLabel = () => {
    switch (timerPhase) {
      case 'before-registration': return 'До начала регистрации:';
      case 'registration': return 'До начала хакатона:';
      case 'hackathon': return 'До конца хакатона:';
      case 'ended': return 'Хакатон завершен';
      default: return '';
    }
  };

  const handleJoin = async () => {
    if (!hackathon) return;
    
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate('/auth');
      return;
    }

    try {
      setIsJoining(true);
      const updatedHackathon = await joinHackathon(hackathon.id, token);
      setHackathon(updatedHackathon);
      setIsParticipant(true);
      setNotification({
        message: 'Вы успешно присоединились к хакатону!',
        type: 'success'
      });
    } catch (error) {
      console.error('Join error:', error);
      setNotification({
        message: error instanceof Error ? error.message : 'Ошибка присоединения',
        type: 'error'
      });
    } finally {
      setIsJoining(false);
    }
  };

  const canJoin = () => {
    if (!hackathon || !isAuthenticated || isParticipant) return false;
    
    const now = new Date();
    const registrationStart = new Date(hackathon.registration_start);
    const startDate = new Date(hackathon.start_date);
    
    return now >= registrationStart && now < startDate && 
           hackathon.current_participants < hackathon.max_participants;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!hackathon) return <div>Hackathon not found</div>;

  return (
    <div className="hackathon-page">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          autoClose={3000}
        />
      )}

      <div className="hackathon-header">
        <img 
          src={hackathon.image_url} 
          alt={hackathon.title}
          className="hackathon-image"
        />
        <div className="hackathon-title-container">
          <h1>{hackathon.title}</h1>
          <p className="hackathon-creator">Создатель: {creatorName}</p>
          
          {isAuthenticated && canJoin() ? (
            <Button
              variant="contained"
              onClick={handleJoin}
              loading={isJoining}
              disabled={!canJoin() || isJoining}
            >
              Присоединиться
            </Button>
          ) : (
            !isAuthenticated ? (
              <Button
                variant="outlined"
                onClick={() => navigate('/auth')}
              >
                Войдите, чтобы присоединиться
              </Button>
            ) : (
              <Button
                variant="outlined"
                disabled={true}
              >
                {isParticipant ? 'Вы уже участвуете' : 
                 timerPhase === 'before-registration' ? 'Регистрация скоро начнется' : 
                 timerPhase === 'ended' ? 'Хакатон завершен' : 
                 hackathon.current_participants >= hackathon.max_participants ? 
                 'Мест нет' : 'Регистрация закрыта'}
              </Button>
            )
          )}
        </div>
      </div>

      <div className="hackathon-details">
        <div className="timer-section">
          <h2>{getTimerLabel()}</h2>
          <div className="timer">{timeLeft}</div>
        </div>

        <div className="detail-section">
          <h2>Описание</h2>
          <p>{hackathon.description}</p>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <h3>Дата начала</h3>
            <p>{new Date(hackathon.start_date).toLocaleDateString()}</p>
          </div>
          <div className="detail-item">
            <h3>Дата окончания</h3>
            <p>{new Date(hackathon.end_date).toLocaleDateString()}</p>
          </div>
          <div className="detail-item">
            <h3>Место проведения</h3>
            <p>{hackathon.location}</p>
          </div>
          <div className="detail-item">
            <h3>Регистрация с</h3>
            <p>{new Date(hackathon.registration_start).toLocaleDateString()}</p>
          </div>
          <div className="detail-item">
            <h3>Участников</h3>
            <p>{hackathon.current_participants} / {hackathon.max_participants}</p>
          </div>
          <div className="detail-item">
            <h3>Статус</h3>
            <p>
              {hackathon.status === 0 && 'Запланирован'}
              {hackathon.status === 1 && 'Активен'}
              {hackathon.status === 2 && 'Завершен'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackathonPage;