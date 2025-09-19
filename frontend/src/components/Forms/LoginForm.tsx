import React, { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { authService, LoginCredentials } from '../../services/authService';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #495057;
  font-size: 0.875rem;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => props.hasError ? '#dc3545' : '#e9ecef'};
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#dc3545' : '#007bff'};
  }
  
  &::placeholder {
    color: #6c757d;
  }
`;

const ErrorMessage = styled.span`
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 4px;
`;

const SubmitButton = styled.button<{ isLoading?: boolean }>`
  background: ${props => props.isLoading ? '#6c757d' : '#007bff'};
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: ${props => props.isLoading ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.isLoading ? '#6c757d' : '#0056b3'};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const loginSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    dispatch(loginStart());

    try {
      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password,
      };

      const response = await authService.login(credentials);
      
      // Store token in localStorage
      localStorage.setItem('token', response.accessToken);
      
      dispatch(loginSuccess({
        user: {
          ...response.researcher,
          role: 'researcher' as const
        },
        token: response.accessToken,
      }));

      dispatch(addNotification({
        type: 'success',
        message: 'Erfolgreich angemeldet!',
      }));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      dispatch(loginFailure());
      
      const errorMessage = error.response?.data?.message || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit(onSubmit)}>
      <FormGroup>
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <Input
          id="email"
          type="email"
          placeholder="ihre.email@beispiel.de"
          hasError={!!errors.email}
          {...register('email')}
        />
        {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          type="password"
          placeholder="Ihr Passwort"
          hasError={!!errors.password}
          {...register('password')}
        />
        {errors.password && <ErrorMessage>{errors.password.message}</ErrorMessage>}
      </FormGroup>

      <SubmitButton type="submit" disabled={isLoading} isLoading={isLoading}>
        {isLoading && <LoadingSpinner />}
        {isLoading ? 'Anmelden...' : 'Anmelden'}
      </SubmitButton>
    </FormContainer>
  );
};

export default LoginForm;