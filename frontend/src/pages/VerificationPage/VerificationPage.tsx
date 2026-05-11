import { useNavigate } from 'react-router-dom';
import { Button } from '../../components';
import './VerificationPage.css';

interface VerificationPageProps {
  status: 'pending' | 'success' | 'error';
  email?: string;
}

const VerificationPage = ({ status, email }: VerificationPageProps) => {
  const navigate = useNavigate();

 return (
    <div className="verification-page">
      {status === 'success' ? (
        <div className="verification-success">
          <h1 className="verification-success__title">Подтверждение успешно!</h1>
          <p className="verification-success__text">
            Ваш email {email} успешно подтвержден. Вы автоматически вошли в систему.
          </p>
          <Button onClick={() => navigate('/')}>
            Перейти на главную
          </Button>
        </div>
      ) : status === 'error' ? (
        <div className="verification-error">
          <h1 className="verification-error__title">Ошибка подтверждения</h1>
          <p className="verification-error__text">
            Не удалось подтвердить email. Возможно, ссылка устарела или неверна.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Вернуться к авторизации
          </Button>
        </div>
      ) : (
        <div className="verification-pending">
          <h1 className="verification-pending__title">Подтвердите ваш email</h1>
          <p className="verification-pending__text">
            На вашу почту {email} было отправлено письмо с ссылкой для подтверждения.
            Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме.
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;