import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

function Profile() {
  const { t, i18n } = useTranslation();
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
    <div style={{ 
      maxWidth: '600px', 
      margin: '40px auto', 
      padding: '30px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      border: '1px solid #dee2e6'
    }}>
      <div style={{ 
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          color: '#2c3e50', 
          fontSize: '1.8em',
          fontWeight: '600'
        }}>
          {t('profile')}
        </h2>
        <p style={{ 
          margin: '0', 
          color: '#6c757d',
          fontSize: '0.95em'
        }}>
          {t('profile_description')}
        </p>
      </div>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '500',
            color: '#495057'
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
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: isEditing ? 'white' : '#f8f9fa',
              color: isEditing ? '#495057' : '#6c757d'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '500',
            color: '#495057'
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
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: isEditing ? 'white' : '#f8f9fa',
              color: isEditing ? '#495057' : '#6c757d'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '500',
            color: '#495057'
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
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: isEditing ? 'white' : '#f8f9fa',
              color: isEditing ? '#495057' : '#6c757d'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '500',
            color: '#495057'
          }}>
            Abteilung/Fachbereich
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="z.B. Psychologie, Geographie"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: isEditing ? 'white' : '#f8f9fa',
              color: isEditing ? '#495057' : '#6c757d'
            }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '500',
            color: '#495057'
          }}>
            Sprache
          </label>
          <select
            name="language"
            value={formData.language}
            onChange={handleLanguageChange}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: isEditing ? 'white' : '#f8f9fa',
              color: isEditing ? '#495057' : '#6c757d'
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
          justifyContent: 'flex-end'
        }}>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              {t('edit')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#545b62')}
                onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#6c757d')}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#1e7e34')}
                onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#28a745')}
              >
                {loading ? t('saving') : t('save')}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default Profile;