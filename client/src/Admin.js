import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

function Admin() {
  const { t } = useTranslation();
  const [audioFiles, setAudioFiles] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Audio-Dateien laden
  useEffect(() => {
    loadAudioFiles();
  }, []);

  const loadAudioFiles = async () => {
    try {
      const response = await axios.get('/api/audio/files');
      setAudioFiles(response.data.files);
    } catch (error) {
      console.error('Fehler beim Laden der Audio-Dateien:', error);
      setMessage('Fehler beim Laden der Audio-Dateien');
    }
  };

  // Audio-Datei hochladen
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setMessage(t('please_select_audio_file'));
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('audio', uploadFile);

    try {
      await axios.post('/api/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setMessage('Audio-Datei erfolgreich hochgeladen!');
      setUploadFile(null);
      loadAudioFiles(); // Liste aktualisieren
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      setMessage('Fehler beim Hochladen der Audio-Datei');
    } finally {
      setUploading(false);
    }
  };

  // Audio-Datei löschen
  const handleDelete = async (filename) => {
    if (!window.confirm(t('delete_audio_confirm', { filename }))) {
      return;
    }

    try {
      await axios.delete(`/api/audio/${filename}`);
      setMessage(t('audio_deleted_successfully'));
      loadAudioFiles(); // Liste aktualisieren
    } catch (error) {
      console.error('Error deleting:', error);
      setMessage(t('audio_delete_error'));
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ 
        background: '#f8f9fa',
        color: '#2c3e50',
        padding: '30px',
        borderRadius: '8px',
        marginBottom: '30px',
        textAlign: 'center',
        border: '1px solid #dee2e6'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2em', fontWeight: '600' }}>{t('audio_management')}</h1>
        <p style={{ margin: '0', fontSize: '1.1em', color: '#6c757d' }}>
          {t('audio_management_description')}
        </p>
      </div>
      
      {/* Upload-Formular */}
      <div style={{ 
        border: '1px solid #dee2e6', 
        padding: '25px', 
        borderRadius: '8px', 
        marginBottom: '25px',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.3em', fontWeight: '500' }}>Audio-Datei hochladen</h2>
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#495057' }}>
              {t('select_file')}:
            </label>
            <input
              type="file"
              accept=".mp3,.wav,.ogg"
              onChange={(e) => setUploadFile(e.target.files[0])}
              style={{ 
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '14px',
                width: '100%',
                maxWidth: '400px'
              }}
            />
          </div>
          <button 
            type="submit" 
            disabled={uploading || !uploadFile}
            style={{
              padding: '10px 20px',
              backgroundColor: uploading ? '#6c757d' : '#007bff',
              color: 'white',
              border: '1px solid transparent',
              borderRadius: '4px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '400',
              opacity: uploading || !uploadFile ? 0.6 : 1
            }}
          >
            {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
          </button>
        </form>
      </div>

      {/* Nachricht */}
      {message && (
        <div style={{
          padding: '15px',
          backgroundColor: message.includes('Fehler') ? '#f8d7da' : '#d4edda',
          color: message.includes('Fehler') ? '#721c24' : '#155724',
          border: `1px solid ${message.includes('Fehler') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '8px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{message.includes('Fehler') ? '❌' : '✅'}</span>
          {message}
          <button 
            onClick={() => setMessage('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Audio-Dateien Liste */}
      <div style={{ 
        border: '1px solid #dee2e6', 
        padding: '25px', 
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.3em', fontWeight: '500' }}>{t('available_audio_files')}</h2>
        {audioFiles.length === 0 ? (
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>{t('no_audio_files_available')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {audioFiles.map((filename, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                backgroundColor: '#f8f9fa'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', color: '#2c3e50', marginBottom: '8px' }}>
                    {filename}
                  </div>
                  <audio controls style={{ width: '100%', maxWidth: '400px' }}>
                    <source src={`/uploads/audio/${filename}`} />
                    {t('audio_not_supported')}
                  </audio>
                </div>
                <button
                  onClick={() => handleDelete(filename)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: '1px solid #dc3545',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '400',
                    marginLeft: '15px'
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ marginTop: '30px', textAlign: 'center', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <a 
          href="/" 
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '400',
            border: '1px solid #28a745'
          }}
        >
          {t('back')}
        </a>
        <a 
          href="/studies" 
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '400',
            border: '1px solid #007bff'
          }}
        >
          Studien verwalten
        </a>
      </div>
    </div>
  );
}

export default Admin;
