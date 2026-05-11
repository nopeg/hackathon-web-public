// src/components/AuthForm/AuthForm.tsx
import React from 'react';
import { Button, InputField } from '../';
import './AuthForm.css';

interface AuthFormProps {
  isRegisterMode: boolean;
  isLoading: boolean;
  errorMessage: string;
  onSubmit: (e: React.FormEvent) => void;
  onToggleMode: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  isRegisterMode,
  isLoading,
  errorMessage,
  onSubmit,
  onToggleMode
}) => (
  <form className="auth-form" onSubmit={onSubmit}>
    {errorMessage && (
      <div className="auth-form__error">
        {errorMessage}
      </div>
    )}

    <InputField
      type="email"
      label="Email"
      name="email"
      value=""
      onChange={() => {}}
      required
    />

    <InputField
      type="password"
      label="Пароль"
      name="password"
      value=""
      onChange={() => {}}
      required
    />

    <Button type="submit" loading={isLoading}>
      {isRegisterMode ? 'Зарегистрироваться' : 'Войти'}
    </Button>

    <button
      type="button"
      className="auth-form__toggle"
      onClick={onToggleMode}
    >
      {isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
    </button>
  </form>
);

export default AuthForm;