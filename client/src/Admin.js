import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { CheckCircle, XCircle, X } from 'lucide-react';

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
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <h1 className="admin-title">{t('audio_management')}</h1>
        <p className="admin-description">
          {t('audio_management_description')}
        </p>
      </div>
      
      {/* Upload-Formular */}
      <div className="admin-section">
        <h2 className="admin-section-title">Audio-Datei hochladen</h2>
        <form onSubmit={handleUpload}>
          <div className="admin-upload-field">
            <label className="admin-upload-label">
              {t('select_file')}:
            </label>
            <input
              type="file"
              accept=".mp3,.wav,.ogg"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="admin-file-input"
            />
          </div>
          <button 
            type="submit" 
            disabled={uploading || !uploadFile}
            className="btn-upload"
          >
            {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
          </button>
        </form>
      </div>

      {/* Nachricht */}
      {message && (
        <div className={`admin-message ${message.includes('Fehler') ? 'admin-message-error' : 'admin-message-success'}`}>
          {message.includes('Fehler') ? <XCircle size={20} className="me-2" /> : <CheckCircle size={20} className="me-2" />}
          {message}
          <button 
            onClick={() => setMessage('')}
            className="admin-message-close"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Audio-Dateien Liste */}
      <div className="admin-section">
        <h2 className="admin-section-title">{t('available_audio_files')}</h2>
        {audioFiles.length === 0 ? (
          <p className="admin-no-files">{t('no_audio_files_available')}</p>
        ) : (
          <div className="audio-list-grid">
            {audioFiles.map((filename, index) => (
              <div key={index} className="audio-item">
                <div className="audio-item-content">
                  <div className="audio-item-name">
                    {filename}
                  </div>
                  <audio controls className="audio-player">
                    <source src={`/uploads/audio/${filename}`} />
                    {t('audio_not_supported')}
                  </audio>
                </div>
                <button
                  onClick={() => handleDelete(filename)}
                  className="btn-delete-audio"
                >
                  {t('delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="admin-nav">
        <a 
          href="/" 
          className="btn-nav-green"
        >
          {t('back')}
        </a>
        <a 
          href="/studies" 
          className="btn-nav-blue"
        >
          Studien verwalten
        </a>
      </div>
    </div>
  );
}

export default Admin;
