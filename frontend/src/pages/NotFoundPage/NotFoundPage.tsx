// src/pages/NotFoundPage/NotFoundPage.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components';
import './NotFoundPage.css';

const NotFoundPage = () => {
    const navigate = useNavigate();
    return (
        <div className="not-found-container">
            <h1>404</h1>
            <h2>Страница не найдена</h2>
            <p>Извините, запрашиваемая страница не существует или была перемещена.</p>
            <Button onClick={() => navigate("/")}>
                Вернуться на главную
            </Button>
        </div>
    );
};

export default NotFoundPage;