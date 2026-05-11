// src/pages/AuthPage/AuthPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AuthFormData, authSchema } from '../../types/types';
import { Alert, Button, InputField } from '../../components';
import './AuthPage.css';

export interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string) => Promise<boolean>;
}

const AuthPage = ({ onLogin, onRegister }: AuthPageProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string; severity: 'success' | 'error' | 'info'} | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  const { 
    control, 
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: yupResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const handleAuth = async (data: AuthFormData) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const success = isRegisterMode 
        ? await onRegister(data.email, data.password)
        : await onLogin(data.email, data.password);

      if (success) {
        if (isRegisterMode) {
          navigate('/verify-email', { state: { email: data.email } });
        } else {
          navigate('/');
        }
      } else {
        setMessage({
          text: isRegisterMode 
            ? 'Ошибка регистрации' 
            : 'Неверный email или пароль',
          severity: 'error',
        });
      }
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Произошла ошибка',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1 className="auth-title">
        {isRegisterMode ? 'Регистрация' : 'Вход'}
      </h1>
      
      {message && (
        <Alert type={message.severity}>
          {message.text}
        </Alert>
      )}

      <form className="auth-form" onSubmit={handleSubmit(handleAuth)}>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <InputField
              {...field}
              label="Email"
              type="email"
              error={errors.email?.message}
              required
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <InputField
              {...field}
              label="Пароль"
              type="password"
              error={errors.password?.message}
              required
            />
          )}
        />
        
        <Button type="submit"  loading={isLoading}>
          {isRegisterMode ? 'Зарегистрироваться' : 'Войти'}
        </Button>

        <Button onClick={() => setIsRegisterMode(!isRegisterMode)}>
          {isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </Button>
      </form>
    </div>
  );
};

export default AuthPage;