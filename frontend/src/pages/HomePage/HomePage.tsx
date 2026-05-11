import { useState, useEffect } from 'react';
import { HackathonCard } from '../../components';
import { getHackathons } from '../../services/apiService';
import { Hackathon, HackathonStatus } from '../../types/types';
import './HomePage.css';

const HomePage = () => {
  const [plannedHackathons, setPlannedHackathons] = useState<Hackathon[]>([]);
  const [registrationHackathons, setRegistrationHackathons] = useState<Hackathon[]>([]);
  const [activeHackathons, setActiveHackathons] = useState<Hackathon[]>([]);
  const [completedHackathons, setCompletedHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        // Делаем параллельные запросы для каждого статуса
        const [planned, registration, active, completed] = await Promise.all([
          getHackathons(HackathonStatus.PLANNED),
          getHackathons(HackathonStatus.REGISTRATION),
          getHackathons(HackathonStatus.ACTIVE),
          getHackathons(HackathonStatus.COMPLETED)
        ]);
        
        setPlannedHackathons(planned);
        setRegistrationHackathons(registration);
        setActiveHackathons(active);
        setCompletedHackathons(completed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="home-page">
      {plannedHackathons.length > 0 && (
        <>
          <h1 className="home-page__title">Ближайшие хакатоны</h1>
          <div className="hackathon-grid">
            {plannedHackathons.map((hackathon) => (
              <div key={hackathon.id} className="hackathon-grid__item">
                <HackathonCard 
                  hackathon={{
                    ...hackathon,
                    start_date: hackathon.start_date.toString()
                  }} 
                />
              </div>
            ))}
          </div>
        </>
      )}

      {registrationHackathons.length > 0 && (
        <>
          <h1 className="home-page__title">Регистрация открыта</h1>
          <div className="hackathon-grid">
            {registrationHackathons.map((hackathon) => (
              <div key={hackathon.id} className="hackathon-grid__item">
                <HackathonCard 
                  hackathon={{
                    ...hackathon,
                    start_date: hackathon.start_date.toString()
                  }} 
                />
              </div>
            ))}
          </div>
        </>
      )}

      {activeHackathons.length > 0 && (
        <>
          <h1 className="home-page__title">Активные хакатоны</h1>
          <div className="hackathon-grid">
            {activeHackathons.map((hackathon) => (
              <div key={hackathon.id} className="hackathon-grid__item">
                <HackathonCard 
                  hackathon={{
                    ...hackathon,
                    start_date: hackathon.start_date.toString()
                  }} 
                />
              </div>
            ))}
          </div>
        </>
      )}

      {completedHackathons.length > 0 && (
        <>
          <h1 className="home-page__title">Завершенные хакатоны</h1>
          <div className="hackathon-grid">
            {completedHackathons.map((hackathon) => (
              <div key={hackathon.id} className="hackathon-grid__item">
                <HackathonCard 
                  hackathon={{
                    ...hackathon,
                    start_date: hackathon.start_date.toString()
                  }} 
                />
              </div>
            ))}
          </div>
        </>
      )}

      {plannedHackathons.length === 0 && 
       registrationHackathons.length === 0 &&
       activeHackathons.length === 0 && 
       completedHackathons.length === 0 && (
        <div className="no-hackathons-message">
          На данный момент нет доступных хакатонов
        </div>
      )}
    </div>
  );
};

export default HomePage;