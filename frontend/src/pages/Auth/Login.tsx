import React from 'react';
import styled from 'styled-components';
import LoginForm from '../../components/Forms/LoginForm';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 32px;
  color: #212529;
  font-size: 1.75rem;
  font-weight: 600;
`;

const Login: React.FC = () => {
  return (
    <LoginContainer>
      <LoginCard>
        <Title>Forscher-Login</Title>
        <LoginForm />
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;