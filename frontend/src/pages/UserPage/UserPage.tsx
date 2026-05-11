// src/pages/UserPage/UserPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser, getHackathons } from '../../services/apiService';
import { Hackathon } from '../../types/types';
import HackathonCard from '../../components/HackathonCard/HackathonCard';
import './UserPage.css';

const UserPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<{
    username: string;
    email: string;
    user_id: number;
  } | null>(null);
  const [createdHackathons, setCreatedHackathons] = useState<Hackathon[]>([]);
  const [participatedHackathons, setParticipatedHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Если userId не передан, показываем данные текущего пользователя
        const targetUserId = userId ? parseInt(userId) : null;
        
        // Получаем данные пользователя
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Требуется авторизация');
        }
        
        const currentUserResponse = await getCurrentUser(token);
        if (!currentUserResponse.success || !currentUserResponse.data) {
          throw new Error('Не удалось загрузить данные пользователя');
        }
        
        // Если userId не указан или совпадает с текущим пользователем
        if (!targetUserId || targetUserId === currentUserResponse.data.user_id) {
          setUserData(currentUserResponse.data);
        } else {
          // Здесь должна быть логика получения данных другого пользователя
          // В текущей реализации API нет такого эндпоинта, поэтому используем текущего пользователя
          setUserData(currentUserResponse.data);
        }
        
        // Получаем все хакатоны
        const allHackathons = await getHackathons();
        
        // Фильтруем хакатоны по организатору
        const created = allHackathons.filter(
          h => h.organizer_id === (targetUserId || currentUserResponse.data.user_id)
        );
        setCreatedHackathons(created);
        
        // Фильтруем хакатоны по участнику
        // В текущей реализации API нет информации об участии, поэтому оставляем пустым
        setParticipatedHackathons([]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        if (err instanceof Error && err.message === 'Требуется авторизация') {
          navigate('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;
  if (!userData) return <div className="error">Пользователь не найден</div>;

  return (
    <div className="user-page">
      <div className="user-profile">
        <h1 className="user-name">{userData.username}</h1>
        <p className="user-email">{userData.email}</p>
      </div>

      <div className="user-hackathons">
        <section className="hackathon-section">
          <h2>Созданные хакатоны</h2>
          {createdHackathons.length > 0 ? (
            <div className="hackathon-grid">
              {createdHackathons.map(hackathon => (
                <HackathonCard 
                  key={hackathon.id}
                  hackathon={{
                    ...hackathon,
                    start_date: hackathon.start_date.toString()
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="no-hackathons">Нет созданных хакатонов</p>
          )}
        </section>

        <section className="hackathon-section">
          <h2>Участие в хакатонах</h2>
          {participatedHackathons.length > 0 ? (
            <div className="hackathon-grid">
              {participatedHackathons.map(hackathon => (
                <HackathonCard 
                  key={hackathon.id}
                  hackathon={{
                    ...hackathon,
                    start_date: hackathon.start_date.toString()
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="no-hackathons">Нет участия в хакатонах</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserPage;