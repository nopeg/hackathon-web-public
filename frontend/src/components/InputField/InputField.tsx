// src/components/InputField/InputField.tsx
import React from 'react';
import './InputField.css';

interface InputFieldProps {
  type: string;
  label: string;
  name: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  type,
  label,
  name,
  value,
  onChange,
  error,
  required
}) => (
  <div className="input-field">
    <label className="input-field__label">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`input-field__input ${error ? 'input-field__input--error' : ''}`}
      required={required}
    />
    {error && <span className="input-field__error">{error}</span>}
  </div>
);

export default InputField;