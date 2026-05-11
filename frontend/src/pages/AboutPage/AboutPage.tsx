// AboutPage.tsx
import React from 'react';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <h1 className="about-page__title">О платформе Hackathon Platform</h1>
      
      <div className="about-page__content">
        <section className="about-page__section">
          <p>
            Hackathon Platform - это современная платформа для организации и участия в хакатонах. 
            Наша миссия - объединять талантливых разработчиков, дизайнеров и специалистов 
            для создания инновационных решений в сжатые сроки.
          </p>
        </section>

        <section className="about-page__section">
          <h2 className="about-page__section-title">Наши возможности</h2>
          <div className="about-page__features">
            <div className="about-page__feature">
              <h3 className="about-page__feature-title">Организация хакатонов</h3>
              <p>
                Легко создавайте и управляйте хакатонами, устанавливайте сроки, 
                темы и критерии оценки.
              </p>
            </div>
            <div className="about-page__feature">
              <h3 className="about-page__feature-title">Участие в проектах</h3>
              <p>
                Присоединяйтесь к командам или создавайте свои, чтобы работать 
                над интересными задачами.
              </p>
            </div>
            <div className="about-page__feature">
              <h3 className="about-page__feature-title">Экспертная оценка</h3>
              <p>
                Профессиональное жюри оценивает проекты по установленным критериям, 
                обеспечивая честность конкурса.
              </p>
            </div>
          </div>
        </section>

        <section className="about-page__section">
          <h2 className="about-page__section-title">Наша команда</h2>
          <p>
            Мы - группа энтузиастов, которые сами не раз участвовали в хакатонах 
            и понимаем, какие инструменты нужны организаторам и участникам. 
            Наша платформа создана разработчиками для разработчиков.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;