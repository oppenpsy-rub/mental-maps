import React, { useState } from 'react';
import { useAuth } from './Auth';
import { useTranslation } from 'react-i18next';

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const { login, register, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRegistering) {
      await register(name, email, password);
    } else {
      await login(email, password);
    }
  };

  return (
    <div style={{ 
      maxWidth: '450px', 
      margin: '60px auto', 
      padding: '40px', 
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e9ecef'
      }}>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          color: '#2c3e50', 
          fontSize: '1.8em', 
          fontWeight: '600' 
        }}>
          {isRegistering ? 'Registrierung' : 'Anmeldung'}
        </h2>
        <p style={{ 
          margin: '0', 
          color: '#6c757d', 
          fontSize: '14px' 
        }}>
          {isRegistering ? t('create_new_account') : t('login_to_account')}
        </p>
      </div>
      
      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '6px',
          border: '1px solid #f5c6cb',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span>
          {t('auth_error')}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontWeight: '500',
              color: '#495057',
              fontSize: '14px'
            }}>
              {t('name')}:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '500',
            color: '#495057',
            fontSize: '14px'
          }}>
            {t('email')}:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '25px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '500',
            color: '#495057',
            fontSize: '14px'
          }}>
            {t('password')}:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#007bff',
            color: 'white',
            border: '1px solid #007bff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            marginBottom: '20px'
          }}
        >
          {isRegistering ? t('register') : t('login')}
        </button>
        
        <div style={{ 
          textAlign: 'center',
          paddingTop: '15px',
          borderTop: '1px solid #e9ecef'
        }}>
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6c757d',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
          >
            {isRegistering ? t('already_registered') : t('not_registered')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;