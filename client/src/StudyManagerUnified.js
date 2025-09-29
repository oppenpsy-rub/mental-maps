import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import ExportManager from './ExportManager';
import { useAuth } from './Auth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Leaflet Icons für React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function StudyManagerUnified() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [studies, setStudies] = useState([]);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('studies');
  const [showNewStudyForm, setShowNewStudyForm] = useState(false);
  const [loading, setLoading] = useState({});
  const [editingStudy, setEditingStudy] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  
  const [newStudy, setNewStudy] = useState({
    name: '',
    config: {
      language: 'de',
      questions: [],
      mapConfig: {
        center: [48.8566, 2.3522], // Paris als Standard
        zoom: 5,
        basemap: "openstreetmap",
        allowZoom: true,
        allowPan: true
      }
    }
  });

  const [availableLanguages] = useState([
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'ro', name: 'Română' }
  ]);

  // Studien laden
  useEffect(() => {
    loadStudies();
    loadAudioFiles();
  }, []);

  const loadAudioFiles = async () => {
    try {
      const response = await axios.get('/api/audio/files');
      // Stelle sicher, dass audioFiles immer ein Array ist
      setAudioFiles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(t('error_loading_audio'), error);
      setAudioFiles([]); // Fallback auf leeres Array
    }
  };

  const uploadAudio = async (file) => {
    const formData = new FormData();
    formData.append('audio', file);
    
    setUploadingAudio(true);
    try {
      const response = await axios.post('/api/upload-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await loadAudioFiles(); // Aktualisiere die Liste
      return response.data.filename;
    } catch (error) {
      console.error(t('audio_upload_error'), error);
      throw error;
    } finally {
      setUploadingAudio(false);
    }
  };

  const loadStudies = async () => {
    try {
      const response = await axios.get('/api/studies');
      setStudies(response.data);
    } catch (error) {
      console.error(t('error_loading_studies'), error);
      setMessage(t('error_loading_studies'));
    }
  };

  // Studie laden zum Bearbeiten
  const loadStudyForEditing = async (studyId) => {
    try {
      const response = await axios.get(`/api/studies/${studyId}`);
      const study = response.data;
      
      // Ergänze fehlende mapConfig-Standardwerte
      if (study.config && study.config.mapConfig) {
        study.config.mapConfig = {
          center: study.config.mapConfig.center || [48.8566, 2.3522],
          zoom: study.config.mapConfig.zoom || 5,
          basemap: study.config.mapConfig.basemap || "openstreetmap",
          allowZoom: study.config.mapConfig.allowZoom !== undefined ? study.config.mapConfig.allowZoom : true,
          allowPan: study.config.mapConfig.allowPan !== undefined ? study.config.mapConfig.allowPan : true
        };
      } else {
        // Erstelle vollständige mapConfig falls sie fehlt
        study.config = study.config || {};
        study.config.mapConfig = {
          center: [48.8566, 2.3522],
          zoom: 5,
          basemap: "openstreetmap",
          allowZoom: true,
          allowPan: true
        };
      }
      
      // Stelle sicher, dass questions-Array existiert
      if (!study.config.questions) {
        study.config.questions = [];
      }
      
      setEditingStudy(study);
      setActiveTab('edit');
    } catch (error) {
      console.error('Fehler beim Laden der Studie:', error);
      setMessage(t('error_loading_study'));
    }
  };

  // {t('new_study')} erstellen
  const createStudy = async () => {
    if (!newStudy.name.trim()) {
      setMessage(t('study_name_required'));
      return;
    }

    try {
      setLoading({...loading, create: true});
      await axios.post('/api/studies', newStudy);
      setMessage(t('study_created_successfully'));
      setShowNewStudyForm(false);
      setNewStudy({
        name: '',
        config: {
          language: 'de',
          questions: [],
          mapConfig: {
            center: [48.8566, 2.3522],
            zoom: 5,
            basemap: "openstreetmap",
            allowZoom: true,
            allowPan: true
          }
        }
      });
      loadStudies();
    } catch (error) {
      console.error('Fehler beim Erstellen der Studie:', error);
      setMessage(t('error_creating_study'));
    } finally {
      setLoading({...loading, create: false});
    }
  };

  // Studie aktualisieren
  const updateStudy = async () => {
    if (!editingStudy.name.trim()) {
      setMessage(t('study_name_required'));
      return;
    }

    try {
      setLoading({...loading, update: true});
      await axios.put(`/api/studies/${editingStudy.id}`, editingStudy);
      setMessage(t('study_updated_successfully'));
      setEditingStudy(null);
      setActiveTab('studies');
      loadStudies();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Studie:', error);
      setMessage(t('error_updating_study'));
    } finally {
      setLoading({...loading, update: false});
    }
  };

  // Studie löschen
  const deleteStudy = async (studyId) => {
    if (!window.confirm(t('confirm_delete_study'))) {
      return;
    }

    try {
      setLoading({...loading, [`delete_${studyId}`]: true});
      await axios.delete(`/api/studies/${studyId}`);
      setMessage(t('study_deleted_successfully'));
      loadStudies();
    } catch (error) {
      console.error('Error deleting study:', error);
      setMessage(t('error_deleting_study'));
    } finally {
      setLoading({...loading, [`delete_${studyId}`]: false});
    }
  };

  // Studie veröffentlichen
  const publishStudy = async (studyId) => {
    try {
      setLoading({...loading, [`publish_${studyId}`]: true});
      await axios.post(`/api/studies/${studyId}/publish`);
      setMessage(t('study_published_successfully'));
      loadStudies();
    } catch (error) {
      console.error('Error publishing study:', error);
      setMessage(t('error_publishing_study'));
    } finally {
      setLoading({...loading, [`publish_${studyId}`]: false});
    }
  };

  // Studie zurückziehen
  const unpublishStudy = async (studyId) => {
    try {
      setLoading({...loading, [`unpublish_${studyId}`]: true});
      await axios.post(`/api/studies/${studyId}/unpublish`);
      setMessage(t('study_unpublished_successfully'));
      loadStudies();
    } catch (error) {
      console.error('Error unpublishing study:', error);
      setMessage(t('error_unpublishing_study'));
    } finally {
      setLoading({...loading, [`unpublish_${studyId}`]: false});
    }
  };

  // {t('cleanup_duplicates')}
  const cleanupDuplicates = async () => {
    try {
      setLoading({...loading, cleanup: true});
      await axios.post('/api/studies/cleanup-duplicates');
      setMessage(t('duplicates_cleaned_successfully'));
      loadStudies();
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      setMessage(t('error_cleaning_duplicates'));
    } finally {
      setLoading({...loading, cleanup: false});
    }
  };

  // Frage zur Studie hinzufügen
  const addQuestion = () => {
    const newQuestion = {
      id: `question_${Date.now()}`,
      type: "map_drawing",
      text: t('new_question'),
      singlePolygon: false,
      maxPolygons: 3,
      required: true,
      allowZoom: editingStudy.config.mapConfig.allowZoom,
      allowPan: editingStudy.config.mapConfig.allowPan,
      audioFile: null // Für audio_perception Fragen
    };
    
    setEditingStudy({
      ...editingStudy,
      config: {
        ...editingStudy.config,
        questions: [...(editingStudy.config.questions || []), newQuestion]
      }
    });
  };

  // Frage löschen
  const deleteQuestion = (questionId) => {
    setEditingStudy({
      ...editingStudy,
      config: {
        ...editingStudy.config,
        questions: editingStudy.config.questions.filter(q => q.id !== questionId)
      }
    });
  };

  // Frage aktualisieren
  const updateQuestion = (questionId, field, value) => {
    setEditingStudy({
      ...editingStudy,
      config: {
        ...editingStudy.config,
        questions: editingStudy.config.questions.map(q => {
          if (q.id === questionId) {
            const updatedQuestion = { ...q, [field]: value };
            
            // Automatisch den Typ auf 'audio_perception' setzen, wenn eine Audio-Datei zugewiesen wird
            if (field === 'audioFile' && value && value.trim() !== '') {
              updatedQuestion.type = 'audio_perception';
            }
            // Typ zurück auf 'map_drawing' setzen, wenn Audio-Datei entfernt wird
            else if (field === 'audioFile' && (!value || value.trim() === '')) {
              updatedQuestion.type = 'map_drawing';
            }
            
            return updatedQuestion;
          }
          return q;
        })
      }
    });
  };

  // Map-Konfiguration aktualisieren
  const updateMapConfig = (field, value) => {
    setEditingStudy({
      ...editingStudy,
      config: {
        ...editingStudy.config,
        mapConfig: {
          ...editingStudy.config.mapConfig,
          [field]: value
        }
      }
    });
  };

  // Interaktive Karten-Komponente für die Konfiguration
  const MapConfigSelector = () => {
    console.log('MapConfigSelector rendering...', editingStudy?.config?.mapConfig);
    
    // Stelle sicher, dass mapConfig existiert, bevor wir die Komponente rendern
    if (!editingStudy?.config?.mapConfig) {
      console.log('MapConfig not available yet');
      return (
        <div style={{ 
          height: '400px', 
          width: '100%', 
          borderRadius: '6px', 
          border: '1px solid #ced4da',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          color: '#6c757d'
        }}>
          {t('loading_map')}
        </div>
      );
    }
    
    const MapEvents = () => {
      useMapEvents({
        click: (e) => {
          console.log('Map clicked:', e.latlng);
          setEditingStudy(prev => ({
            ...prev,
            config: {
              ...prev.config,
              mapConfig: {
                ...prev.config.mapConfig,
                center: [e.latlng.lat, e.latlng.lng]
              }
            }
          }));
        },
        zoomend: (e) => {
          try {
            const zoom = e.target.getZoom();
            console.log('Zoom ended:', zoom);
            setEditingStudy(prev => ({
              ...prev,
              config: {
                ...prev.config,
                mapConfig: {
                  ...prev.config.mapConfig,
                  zoom: zoom
                }
              }
            }));
          } catch (error) {
            console.error('Error in zoomend event:', error);
          }
        },
        moveend: (e) => {
          try {
            const center = e.target.getCenter();
            console.log('Move ended:', center);
            setEditingStudy(prev => ({
              ...prev,
              config: {
                ...prev.config,
                mapConfig: {
                  ...prev.config.mapConfig,
                  center: [center.lat, center.lng]
                }
              }
            }));
          } catch (error) {
            console.error('Error in moveend event:', error);
          }
        }
      });
      return null;
    };

    const getTileLayerUrl = (basemap) => {
      switch (basemap) {
        case 'satellite':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        case 'topographic':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
        default:
          // Verwende direkten OSM-Server für bessere Kompatibilität
          return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      }
    };

    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          marginBottom: '10px', 
          padding: '10px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#1565c0'
        }}>
          💡 <strong>{t('map_config_tip')}</strong>
        </div>
        <div style={{ height: '400px', width: '100%', borderRadius: '6px', border: '1px solid #ced4da' }}>
          <MapContainer
            center={editingStudy.config.mapConfig.center}
            zoom={editingStudy.config.mapConfig.zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            touchZoom={true}
            boxZoom={true}
            keyboard={true}
            zoomControl={true}
            minZoom={1}
            maxZoom={20}
            zoomSnap={0.25}
            zoomDelta={0.25}
            wheelPxPerZoomLevel={120}
          >
            <TileLayer
              url={getTileLayerUrl(editingStudy.config.mapConfig.basemap)}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapEvents />
          </MapContainer>
        </div>
        <div style={{ 
          marginTop: '10px', 
          fontSize: '14px', 
          color: '#6c757d',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Zentrum: {editingStudy.config.mapConfig.center[0].toFixed(4)}, {editingStudy.config.mapConfig.center[1].toFixed(4)}</span>
          <span>Zoom: {editingStudy.config.mapConfig.zoom}</span>
        </div>
      </div>
    );
  };

  // Hilfsfunktion für Button-Styling
  const getButtonStyle = (variant = 'primary', disabled = false) => {
    const baseStyle = {
      padding: '8px 16px',
      border: '1px solid transparent',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      fontWeight: '400',
      transition: 'all 0.2s ease',
      opacity: disabled ? 0.6 : 1
    };

    const variants = {
      primary: { backgroundColor: '#007bff', color: 'white', border: '1px solid #007bff' },
      success: { backgroundColor: '#28a745', color: 'white', border: '1px solid #28a745' },
      danger: { backgroundColor: '#dc3545', color: 'white', border: '1px solid #dc3545' },
      warning: { backgroundColor: '#ffc107', color: '#212529', border: '1px solid #ffc107' },
      secondary: { backgroundColor: '#6c757d', color: 'white', border: '1px solid #6c757d' },
      outline: { backgroundColor: 'transparent', color: '#007bff', border: '1px solid #007bff' }
    };

    return { ...baseStyle, ...variants[variant] };
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Auch bei Fehler zur Login-Seite navigieren
      navigate('/admin/login');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ 
        background: '#f8f9fa',
        color: '#2c3e50',
        padding: '30px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #dee2e6',
        position: 'relative'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2em', fontWeight: '600' }}>{t('study_manager_title')}</h1>
        <p style={{ margin: '0', fontSize: '1.1em', color: '#6c757d' }}>
          {t('study_manager_description')}
        </p>
        
        {/* Profile and Logout Buttons */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => navigate('/admin/profile')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#545b62'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            👤 Profil
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            🚪 Abmelden
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #dee2e6',
        marginBottom: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #dee2e6'
      }}>
        {[
          { id: 'studies', label: t('manage_studies'), icon: '📚' },
        { id: 'published', label: t('published_studies'), icon: '🌐' },
        { id: 'analytics', label: t('analytics_export'), icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '15px 25px',
              backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6c757d',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: activeTab === tab.id ? '500' : 'normal',
              transition: 'all 0.2s ease',
              flex: 1
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Nachrichten */}
      {message && (
        <div style={{
          padding: '15px',
          backgroundColor: message.includes('Fehler') ? '#f8d7da' : '#d4edda',
          color: message.includes('Fehler') ? '#721c24' : '#155724',
          border: `1px solid ${message.includes('Fehler') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '8px',
          marginBottom: '20px',
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

      {/* Studien verwalten Tab */}
      {activeTab === 'studies' && (
        <div style={{ 
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, color: '#333' }}>📝 {t('manage_studies_title')}</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={cleanupDuplicates}
                disabled={loading.cleanup}
                style={getButtonStyle('warning', loading.cleanup)}
              >
                {loading.cleanup ? `🔄 ${t('cleaning')}` : `🧹 ${t('cleanup_duplicates')}`}
              </button>
              <button
                onClick={() => setShowNewStudyForm(true)}
                style={getButtonStyle('success')}
              >
                ➕ {t('create_new_study')}
              </button>
            </div>
          </div>
          
          {showNewStudyForm && (
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '25px',
              borderRadius: '10px',
              marginBottom: '30px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginTop: 0, color: '#495057' }}>✨ {t('create_new_study')}</h3>
              
              <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 200px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                    {t('study_name')}:
                  </label>
                  <input
                    type="text"
                    value={newStudy.name}
                    onChange={(e) => setNewStudy({...newStudy, name: e.target.value})}
                    placeholder={t('enter_study_name')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                    {t('language')}:
                  </label>
                  <select
                    value={newStudy.config.language}
                    onChange={(e) => setNewStudy({
                      ...newStudy,
                      config: {
                        ...newStudy.config,
                        language: e.target.value
                      }
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                  >
                    {availableLanguages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowNewStudyForm(false)}
                  style={getButtonStyle('secondary')}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={createStudy}
                  disabled={loading.create || !newStudy.name.trim()}
                  style={getButtonStyle('success', loading.create || !newStudy.name.trim())}
                >
                  {loading.create ? `🔄 ${t('creating')}` : `✅ ${t('create_study')}`}
                </button>
              </div>
            </div>
          )}

          {/* Studien-Liste */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {studies.filter(study => study.status === 'draft').map(study => (
              <div key={study.id} style={{
                border: '1px solid #dee2e6',
                padding: '20px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.2em', fontWeight: '500' }}>
                      {study.name}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                      <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
                        <strong>{t('created')}:</strong> {new Date(study.created_at).toLocaleDateString('de-DE')}
                      </p>
                      <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
                        <strong>{t('language')}:</strong> {availableLanguages.find(l => l.code === study.config?.language)?.name || t('unknown')}
                      </p>
                      <p style={{ margin: 0, color: '#6c757d' }}>
                        <strong>{t('questions')}:</strong> {study.config?.questions?.length || 0}
                      </p>
                      <p style={{ margin: 0, color: '#6c757d' }}>
                        <strong>{t('status')}:</strong> <span style={{ 
                          color: '#ffc107', 
                          fontWeight: 'bold',
                          backgroundColor: '#fff3cd',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          border: '1px solid #ffeaa7'
                        }}>📝 {t('draft')}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        if (study.status === 'published') {
                          alert(t('published_studies_cannot_be_edited'));
                          return;
                        }
                        loadStudyForEditing(study.id);
                      }}
                      disabled={study.status === 'published'}
                      style={{
                        ...getButtonStyle('primary', study.status === 'published'),
                        opacity: study.status === 'published' ? 0.5 : 1,
                        cursor: study.status === 'published' ? 'not-allowed' : 'pointer'
                      }}
                      title={study.status === 'published' ? t('published_studies_cannot_be_edited') : t('edit_study')}
                    >
                      ✏️ {t('edit')}
                    </button>
                    <button
                      onClick={() => publishStudy(study.id)}
                      disabled={loading[`publish_${study.id}`]}
                      style={getButtonStyle('success', loading[`publish_${study.id}`])}
                    >
                      {loading[`publish_${study.id}`] ? '🔄' : '🚀'} {t('publish')}
                    </button>
                    <button
                      onClick={() => deleteStudy(study.id)}
                      disabled={loading[`delete_${study.id}`]}
                      style={getButtonStyle('danger', loading[`delete_${study.id}`])}
                    >
                      {loading[`delete_${study.id}`] ? '🔄' : '🗑️'} {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {studies.filter(study => study.status === 'draft').length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px', 
                color: '#6c757d',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '3em', marginBottom: '20px' }}>📝</div>
                <h3>{t('no_studies_available')}</h3>
                <p>{t('create_first_study_to_begin')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Veröffentlichte Studien Tab */}
      {activeTab === 'published' && (
        <div style={{ 
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>🌐 {t('published_studies')}</h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            {studies.filter(study => study.status === 'published').map(study => (
              <div key={study.id} style={{
                border: '1px solid #dee2e6',
                padding: '25px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#28a745', fontSize: '1.3em' }}>
                      🌐 {study.name}
                    </h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <strong>🔗 {t('public_link')}:</strong>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        marginTop: '8px',
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6'
                      }}>
                        <input
                          type="text"
                          value={`${window.location.origin}/survey/${study.publicId || study.id}`}
                          readOnly
                          style={{
                            flex: 1,
                            padding: '8px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            backgroundColor: 'white'
                          }}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/survey/${study.publicId || study.id}`);
                            setMessage(t('link_copied_to_clipboard'));
                          }}
                          style={getButtonStyle('outline')}
                        >
                          📋 {t('copy')}
                        </button>
                        <button
                          onClick={() => window.open(`${window.location.origin}/survey/${study.publicId || study.id}`, '_blank')}
                          style={getButtonStyle('primary')}
                        >
                          🔗 {t('open')}
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <p style={{ margin: 0, color: '#6c757d' }}>
                        <strong>{t('published')}:</strong> {new Date(study.publishedAt || Date.now()).toLocaleDateString('de-DE')}
                      </p>
                      <p style={{ margin: 0, color: '#6c757d' }}>
                        <strong>{t('language')}:</strong> {availableLanguages.find(l => l.code === study.config?.language)?.name || t('unknown')}
                      </p>
                      <p style={{ margin: 0, color: '#6c757d' }}>
                        <strong>{t('questions')}:</strong> {study.config?.questions?.length || 0}
                      </p>
                      <p style={{ margin: 0, color: '#6c757d' }}>
                        <strong>{t('status')}:</strong> <span style={{ 
                          color: '#28a745', 
                          fontWeight: 'bold',
                          backgroundColor: '#d4edda',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          border: '1px solid #c3e6cb'
                        }}>🌐 {t('published')}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        alert(t('published_studies_cannot_be_edited'));
                      }}
                      disabled={true}
                      style={{
                        ...getButtonStyle('primary', true),
                        opacity: 0.5,
                        cursor: 'not-allowed'
                      }}
                      title={t('published_studies_cannot_be_edited')}
                    >
                      ✏️ {t('edit')}
                    </button>
                    <button
                      onClick={() => unpublishStudy(study.id)}
                      disabled={loading[`unpublish_${study.id}`]}
                      style={getButtonStyle('warning', loading[`unpublish_${study.id}`])}
                    >
                      {loading[`unpublish_${study.id}`] ? '🔄' : '📥'} {t('unpublish')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {studies.filter(study => study.status === 'published').length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px', 
                color: '#6c757d',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '3em', marginBottom: '20px' }}>🌐</div>
                <h3>{t('no_published_studies')}</h3>
                <p>{t('publish_study_to_see_here')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics & Export Tab */}
      {activeTab === 'analytics' && (
        <div style={{ 
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, color: '#333' }}>📊 {t('analytics_export')}</h2>
          </div>
          
          {showExport ? (
            <ExportManager 
              studyId={showExport.id}
              studyName={showExport.name}
              onBack={() => setShowExport(false)}
            />
          ) : (
            <div>
              <p style={{ marginBottom: '20px', color: '#6c757d' }}>
                {t('select_study_for_analytics')}:
              </p>
              
              {studies.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px', 
                  color: '#6c757d',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '10px',
                  border: '2px dashed #dee2e6'
                }}>
                  <div style={{ fontSize: '3em', marginBottom: '20px' }}>📊</div>
                  <h3>{t('no_studies_available')}</h3>
                  <p>{t('create_study_first_for_analytics')}</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {studies.map(study => {
                    const config = typeof study.config === 'string' ? JSON.parse(study.config) : study.config;
                    const isPublished = study.status === 'published';
                    
                    return (
                      <div key={study.id} style={{
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: '#ffffff',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                      onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '18px' }}>
                              {study.name}
                            </h3>
                            <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#6c757d', marginBottom: '10px' }}>
                              <span>📅 {new Date(study.created_at).toLocaleDateString('de-DE')}</span>
                              <span>❓ {config.questions.length} {t('questions')}</span>
                              <span style={{ 
                                color: isPublished ? '#28a745' : '#ffc107',
                                fontWeight: '500'
                              }}>
                                {isPublished ? `🌐 ${t('published')}` : `📝 ${t('draft')}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setShowExport({ id: study.id, name: study.name })}
                            style={getButtonStyle('primary')}
                          >
                            📊 {t('open_analytics_export')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Studie bearbeiten */}
      {editingStudy && (
        <div style={{ 
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginTop: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, color: '#333' }}>✏️ {t('edit_study')}: {editingStudy.name}</h2>
            <button
              onClick={() => {
                setEditingStudy(null);
                setActiveTab('studies');
              }}
              style={getButtonStyle('secondary')}
            >
              ❌ {t('close')}
            </button>
          </div>
          
          {/* Tabs für die verschiedenen Bearbeitungsbereiche */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '2px solid #dee2e6',
            marginBottom: '30px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px 10px 0 0',
            overflow: 'hidden'
          }}>
            {[
              { id: 'general', label: `⚙️ ${t('general_settings')}` },
              { id: 'map', label: `🗺️ ${t('map_configuration')}` },
              { id: 'questions', label: `❓ ${t('manage_questions')}` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(`edit_${tab.id}`)}
                style={{
                  padding: '15px 25px',
                  backgroundColor: activeTab === `edit_${tab.id}` ? '#007bff' : 'transparent',
                  color: activeTab === `edit_${tab.id}` ? 'white' : '#495057',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: activeTab === `edit_${tab.id}` ? 'bold' : 'normal',
                  flex: 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Allgemeine Einstellungen */}
          {(activeTab === 'edit' || activeTab === 'edit_general') && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#495057', marginBottom: '20px' }}>⚙️ {t('general_settings')}</h3>
              
              <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 200px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                    {t('study_name')}:
                  </label>
                  <input
                    type="text"
                    value={editingStudy.name}
                    onChange={(e) => setEditingStudy({...editingStudy, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                    {t('language')}:
                  </label>
                  <select
                    value={editingStudy.config.language}
                    onChange={(e) => setEditingStudy({
                      ...editingStudy,
                      config: {
                        ...editingStudy.config,
                        language: e.target.value
                      }
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                  >
                    {availableLanguages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Karten-Konfiguration */}
          {activeTab === 'edit_map' && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#495057', marginBottom: '20px' }}>🗺️ {t('map_configuration')}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                    {t('basemap')}:
                  </label>
                  <select
                    value={editingStudy.config.mapConfig.basemap}
                    onChange={(e) => updateMapConfig('basemap', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '16px'
                    }}
                  >
                    <option value="openstreetmap">🗺️ {t('openstreetmap')}</option>
                    <option value="satellite">🛰️ {t('satellite')}</option>
                    <option value="topographic">🏔️ {t('topographic')}</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                    {t('configure_map_extent')}:
                  </label>
                  <MapConfigSelector />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                  <input
                    type="checkbox"
                    checked={editingStudy.config.mapConfig.allowZoom}
                    onChange={(e) => updateMapConfig('allowZoom', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  🔍 {t('allow_zoom')}
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                  <input
                    type="checkbox"
                    checked={editingStudy.config.mapConfig.allowPan}
                    onChange={(e) => updateMapConfig('allowPan', e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  🖱️ {t('allow_pan')}
                </label>
              </div>
            </div>
          )}
          
          {/* Fragen verwalten */}
          {activeTab === 'edit_questions' && (
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#495057', margin: 0 }}>❓ {t('manage_questions')}</h3>
                <button
                  onClick={addQuestion}
                  style={getButtonStyle('success')}
                >
                  ➕ {t('add_new_question')}
                </button>
              </div>
              
              {editingStudy.config.questions.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px', 
                  color: '#6c757d',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '10px',
                  border: '2px dashed #dee2e6'
                }}>
                  <div style={{ fontSize: '3em', marginBottom: '20px' }}>❓</div>
                  <h4>{t('no_questions_available')}</h4>
                  <p>{t('add_new_question_to_begin')}</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {editingStudy.config.questions.map((question, index) => (
                    <div key={question.id} style={{
                      border: '1px solid #dee2e6',
                      padding: '20px',
                      borderRadius: '10px',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: '#495057' }}>{t('question')} {index + 1}</h4>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          style={getButtonStyle('danger')}
                        >
                          🗑️ {t('delete')}
                        </button>
                      </div>
                      
                      <div style={{ display: 'grid', gap: '15px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            {t('question_text')}:
                          </label>
                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ced4da',
                              borderRadius: '5px'
                            }}
                          />
                        </div>
                        
                        {/* Audio-Upload für alle Fragen (optional) */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            🎵 {t('audio_file_optional')}:
                          </label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                            <select
                              value={question.audioFile || ''}
                              onChange={(e) => updateQuestion(question.id, 'audioFile', e.target.value)}
                              style={{
                                flex: 1,
                                padding: '10px',
                                border: '1px solid #ced4da',
                                borderRadius: '5px'
                              }}
                            >
                              <option value="">{t('no_audio_file_selected')}</option>
                              {audioFiles && Array.isArray(audioFiles) && audioFiles.map(file => (
                                <option key={file} value={file}>{file}</option>
                              ))}
                            </select>
                            
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  try {
                                    const filename = await uploadAudio(file);
                                    updateQuestion(question.id, 'audioFile', filename);
                                    setMessage(t('audio_file_uploaded_successfully'));
                                  } catch (error) {
                                    setMessage(t('error_uploading_audio_file'));
                                  }
                                }
                              }}
                              style={{ display: 'none' }}
                              id={`audio-upload-${question.id}`}
                            />
                            <label
                              htmlFor={`audio-upload-${question.id}`}
                              style={{
                                ...getButtonStyle('primary'),
                                cursor: 'pointer',
                                display: 'inline-block',
                                opacity: uploadingAudio ? 0.6 : 1
                              }}
                            >
                              {uploadingAudio ? `⏳ ${t('uploading')}` : `📁 ${t('upload')}`}
                            </label>
                          </div>
                          
                          {/* Audio-Vorschau */}
                          {question.audioFile && (
                            <div style={{ 
                              padding: '10px', 
                              backgroundColor: '#e9ecef', 
                              borderRadius: '5px',
                              border: '1px solid #ced4da'
                            }}>
                              <div style={{ marginBottom: '5px', fontSize: '14px', color: '#495057' }}>
                                📄 {t('selected_file')}: <strong>{question.audioFile}</strong>
                              </div>
                              <audio 
                                controls 
                                style={{ width: '100%' }}
                                src={`/uploads/audio/${question.audioFile}`}
                              >
                                {t('browser_does_not_support_audio')}
                              </audio>
                            </div>
                          )}
                        </div>
                        
                        {/* Karten-spezifische Einstellungen */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                              {t('max_polygons')}:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={question.maxPolygons}
                              onChange={(e) => updateQuestion(question.id, 'maxPolygons', parseInt(e.target.value))}
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ced4da',
                                borderRadius: '5px'
                              }}
                            />
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingTop: '25px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={question.singlePolygon}
                                onChange={(e) => updateQuestion(question.id, 'singlePolygon', e.target.checked)}
                              />
                              {t('single_polygon_only')}
                            </label>
                          </div>
                        </div>
                        
                        {/* Allgemeine Einstellungen für alle Fragentypen */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingTop: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                            />
                            {t('required_question')}
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* {t('save')}/{t('cancel')} Buttons */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
            <button
              onClick={() => {
                setEditingStudy(null);
                setActiveTab('studies');
              }}
              style={getButtonStyle('secondary')}
            >
              ❌ {t('cancel')}
            </button>
            
            <button
              onClick={updateStudy}
              disabled={loading.update || !editingStudy.name.trim()}
              style={getButtonStyle('success', loading.update || !editingStudy.name.trim())}
            >
              {loading.update ? `🔄 ${t('saving')}` : `💾 ${t('save_changes')}`}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '50px', textAlign: 'center', padding: '20px', borderTop: '1px solid #dee2e6' }}>
        <button
          onClick={() => window.history.back()}
          style={getButtonStyle('secondary')}
        >
          ← {t('back_to_survey')}
        </button>
      </div>
    </div>
  );
}

export default StudyManagerUnified;