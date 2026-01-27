import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Auth';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './index.css';

function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    department: '',
    language: 'de'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Available languages
  const languages = [
    { code: 'de', name: 'Deutsch' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'ro', name: 'Română' },
    { code: 'zh', name: '中文' },
    { code: 'ru', name: 'Русский' },
    { code: 'ca', name: 'Català' }
  ];

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        institution: currentUser.institution || '',
        department: currentUser.department || '',
        language: currentUser.language || i18n.language || 'de'
      });
    }
  }, [currentUser, i18n.language]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setFormData(prev => ({
      ...prev,
      language: newLanguage
    }));
    i18n.changeLanguage(newLanguage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.put('/api/auth/profile', formData);
      
      // Update current user context
      setCurrentUser(response.data.user);
      
      // Update i18n language if it was changed
      if (formData.language && formData.language !== i18n.language) {
        i18n.changeLanguage(formData.language);
      }
      
      setMessage({ 
        type: 'success', 
        text: t('profile_updated_successfully')
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || t('error_updating_profile')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        institution: currentUser.institution || '',
        department: currentUser.department || '',
        language: currentUser.language || i18n.language || 'de'
      });
    }
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        padding: '40px 30px',
        marginBottom: '30px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '2em', fontWeight: '600' }}>
            {t('profile')}
          </h1>
          <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
            {t('profile_description')}
          </p>
        </div>
      </div>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 30px 30px' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>

        {message.text && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: message.type === 'success' ? '#eef4ee' : '#f8eded',
            border: `1px solid ${message.type === 'success' ? '#c8e7d3' : '#e6b8b8'}`,
            color: message.type === 'success' ? '#1f3b2d' : '#7a1f1f',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>{message.text}</div>
            <button 
              onClick={() => setMessage({ type: '', text: '' })} 
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'inherit',
                padding: '0 5px'
              }}
            >×</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d7dce3',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#2c3e50',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                cursor: isEditing ? 'text' : 'not-allowed'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              E-Mail *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d7dce3',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#2c3e50',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                cursor: isEditing ? 'text' : 'not-allowed'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Institution
            </label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder={t('organization_placeholder')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d7dce3',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#2c3e50',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                cursor: isEditing ? 'text' : 'not-allowed'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              {t('department_faculty')}
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder={t('department_placeholder')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d7dce3',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#2c3e50',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                cursor: isEditing ? 'text' : 'not-allowed'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              {t('language')}
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleLanguageChange}
              disabled={!isEditing}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d7dce3',
                backgroundColor: isEditing ? '#ffffff' : '#f8fafc',
                color: '#2c3e50',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                cursor: isEditing ? 'pointer' : 'not-allowed'
              }}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '20px',
            marginTop: '24px'
          }}>
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
                >
                  {t('back')}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#2c3e50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1a252f'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2c3e50'}
                >
                  {t('edit')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancel();
                  }}
                  disabled={loading}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s ease',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#7f8c8d')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#95a5a6')}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s ease',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#229954')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#27ae60')}
                >
                  {loading ? t('saving') : t('save')}
                </button>
              </>
            )}
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
