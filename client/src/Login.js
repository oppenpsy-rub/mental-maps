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
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        padding: '40px 30px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '2em', fontWeight: '600' }}>
            {isRegistering ? 'Registrierung' : 'Anmeldung'}
          </h1>
          <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
            {isRegistering ? t('create_new_account') : t('login_to_account')}
          </p>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 20px' }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
      
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: '#f8eded',
          border: '1px solid #e6b8b8',
          color: '#7a1f1f',
          fontSize: '14px'
        }}>
          {t('auth_error')}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {isRegistering && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#2c3e50'
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
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d7dce3',
                backgroundColor: '#ffffff',
                color: '#2c3e50',
                fontSize: '1rem',
                transition: 'all 0.2s ease'
              }}
            />
          </div>
        )}
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#2c3e50'
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
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d7dce3',
              backgroundColor: '#ffffff',
              color: '#2c3e50',
              fontSize: '1rem',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#2c3e50'
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
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d7dce3',
              backgroundColor: '#ffffff',
              color: '#2c3e50',
              fontSize: '1rem',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
        
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#2c3e50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1a252f'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#2c3e50'}
        >
          {isRegistering ? t('register') : t('login')}
        </button>
        
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2c3e50',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline',
              padding: 0
            }}
            onMouseOver={(e) => e.target.style.color = '#1a252f'}
            onMouseOut={(e) => e.target.style.color = '#2c3e50'}
          >
            {isRegistering ? t('already_registered') : t('not_registered')}
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
}

export default Login;