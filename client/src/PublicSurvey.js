import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './Auth';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

// Leaflet Icons für React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Hilfsfunktionen für Tile Layer URLs und Attributions
const getTileLayerUrl = (basemap) => {
  switch (basemap) {
    case 'satellite':
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    case 'topographic':
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
    default:
      // Verwende mehrere OSM-Server für bessere Verfügbarkeit
      return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
};

const getTileLayerAttribution = (basemap) => {
  switch (basemap) {
    case 'satellite':
      return '&copy; <a href="https://www.esri.com/">Esri</a>, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community';
    case 'topographic':
      return '&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community';
    default:
      return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  }
};

function PublicSurvey({ studyId, accessCode: propAccessCode, setAccessCode: propSetAccessCode }) {
  const { t, i18n } = useTranslation();
  const { loading: authLoading, currentUser } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isPreview = searchParams.get('preview') === 'true';

  const [localAccessCode, setLocalAccessCode] = useState('');
  const accessCode = propAccessCode !== undefined ? propAccessCode : localAccessCode;
  const setAccessCode = propSetAccessCode || setLocalAccessCode;

  const [study, setStudy] = useState(null);
  const [participantCode, setParticipantCode] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [polygons, setPolygons] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [languageChanged, setLanguageChanged] = useState(false);
  const [allResponses, setAllResponses] = useState({});

  // Helper function to check if a question should be shown based on filters
  const shouldShowQuestion = (question, responses = allResponses) => {
    if (!question.filter || !question.filter.questionId) return true;
    
    const previousAnswer = responses[question.filter.questionId];
    // If the dependency question hasn't been answered (or was skipped), hide this one
    if (!previousAnswer) return false;
    
    if (Array.isArray(previousAnswer)) {
      return previousAnswer.includes(question.filter.requiredAnswer);
    }

    return previousAnswer === question.filter.requiredAnswer;
  };

  // Effect für Sprachänderungen
  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageChanged(prev => !prev); // Toggle um Re-Render zu erzwingen
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const loadStudy = async () => {
    try {
      setLoading(true);
      console.log('=== LOADSTUDY START ===');
      console.log('StudyId:', studyId);
      
      const endpoint = isPreview ? `/api/studies/${studyId}/preview` : `/api/studies/${studyId}/public`;
      const response = await axios.get(endpoint);
      console.log('=== API RESPONSE ===');
      console.log('Response data:', response.data);

      let rawConfig = response.data.config;
      let config;
      if (typeof rawConfig === 'string') {
        try {
          config = JSON.parse(rawConfig);
        } catch (e) {
          console.error('Fehler beim Parsen der Studienkonfiguration (String):', e);
          config = {};
        }
      } else {
        config = rawConfig || {};
      }

      // Fallback: Stelle sicher, dass mapConfig und questions existieren (wie im Editor)
      if (config && config.mapConfig) {
        config.mapConfig = {
          center: config.mapConfig.center || [48.8566, 2.3522],
          zoom: config.mapConfig.zoom || 5,
          basemap: config.mapConfig.basemap || 'openstreetmap',
          allowZoom: config.mapConfig.allowZoom !== undefined ? config.mapConfig.allowZoom : true,
          allowPan: config.mapConfig.allowPan !== undefined ? config.mapConfig.allowPan : true
        };
      } else {
        config = config || {};
        config.mapConfig = {
          center: [48.8566, 2.3522],
          zoom: 5,
          basemap: 'openstreetmap',
          allowZoom: true,
          allowPan: true
        };
      }

      if (!Array.isArray(config.questions)) {
        config.questions = [];
      }

      console.log('Normalized config in PublicSurvey:', config);
      
      if (response.data.requiresAccessCode && !accessCode) {
        console.log('Access code required, showing form');
        setShowAccessCodeForm(true);
        setLoading(false);
        return;
      }

      if (response.data.requiresAccessCode && accessCode) {
        console.log('Verifying access code');
        const verifyEndpoint = isPreview ? `/api/studies/${studyId}/preview/verify-access` : `/api/studies/${studyId}/verify-access`;
        const accessResponse = await axios.post(verifyEndpoint, {
          accessCode: accessCode
        });
        
        if (!accessResponse.data.valid) {
          setError(t('invalid_access_code'));
          setShowAccessCodeForm(true);
          setLoading(false);
          return;
        }
      }

      console.log('=== SETTING STUDY DATA ===');
      const studyData = { ...response.data, config };
      setStudy(studyData);
      const questionsFromConfig = Array.isArray(config.questions) ? config.questions : [];
      setQuestions(questionsFromConfig);
      if (questionsFromConfig.length > 0) {
        setCurrentQuestion(questionsFromConfig[0]);
      }
      
      if (config && config.language) {
        console.log('=== LANGUAGE CHANGE START ===');
        console.log('Changing language to:', config.language);
        console.log('Available languages:', Object.keys(i18n.options.resources));
        console.log('Current language before change:', i18n.language);
        await i18n.changeLanguage(config.language);
        console.log('Current language after change:', i18n.language);
        console.log('Test translation for "loading":', i18n.t('loading'));
        setLanguageChanged(true); // Force re-render nach Sprachänderung
        console.log('=== LANGUAGE CHANGE END ===');
      } else {
        console.log('No language configuration found');
      }
      
      // Teilnehmer wird erst beim ersten Speichern von Polygonen erstellt
      console.log('=== LOADSTUDY END ===');
      
    } catch (error) {
      console.error('=== LOADSTUDY ERROR ===');
      console.error('Fehler beim Laden der Studie:', error);
      setError(t('study_not_found'));
    } finally {
      setLoading(false);
    }
  };

  // Studie laden
  useEffect(() => {
    // Im Preview-Modus warten wir auf die Authentifizierung
    if (isPreview && authLoading) {
      return;
    }
    loadStudy();
  }, [studyId, accessCode, isPreview, authLoading]);

  const createParticipant = async () => {
    if (isPreview) {
      const demoCode = 'PREVIEW-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      setParticipantCode(demoCode);
      return demoCode;
    }
    try {
      const response = await axios.post('/api/participants', {
        studyId: studyId
      });
      const newCode = response.data.code;
      setParticipantCode(newCode);
      return newCode;
    } catch (error) {
      console.error('Fehler beim Erstellen des Teilnehmers:', error);
      // Fallback: Generiere lokalen Teilnehmer-Code
      const fallbackCode = 'DEMO-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setParticipantCode(fallbackCode);
      return fallbackCode;
    }
  };

  const handleAccessCodeSubmit = async (e) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) {
      setError(t('please_enter_access_code'));
      return;
    }
    
    setAccessCode(accessCodeInput.trim());
    setShowAccessCodeForm(false);
    // Lade Studie mit dem neuen Zugangsschlüssel - useEffect wird durch setAccessCode getriggert
  };

  const handleNextQuestion = (currentResponses = allResponses) => {
    let nextIndex = currentQuestionIndex + 1;
    
    // Skip questions that shouldn't be shown based on filters
    while (nextIndex < questions.length) {
      if (shouldShowQuestion(questions[nextIndex], currentResponses)) {
        break;
      }
      nextIndex++;
    }

    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      setPolygons([]);
      setAnswer(null);
    } else {
      // Use a more user-friendly completion message instead of alert
      const completionMessage = `Umfrage abgeschlossen! Ihr Teilnehmer-Code: ${participantCode}`;
      
      // Create a custom modal instead of browser alert
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;
      
      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 400px;
        width: 90%;
      `;
      
      content.innerHTML = `
        <h2 style="color: #28a745; margin-bottom: 20px;">✅ ${t('survey_complete')}</h2>
        <p style="margin-bottom: 20px; font-size: 16px;">${t('thank_you')}</p>
        <p style="margin-bottom: 20px; font-weight: bold; font-size: 18px; color: #007bff;">
          ${t('participant_code')}: ${participantCode}
        </p>
        <button id="closeModal" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        ">OK</button>
      `;
      
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      // Close modal when clicking OK or outside
      const closeModal = () => {
        document.body.removeChild(modal);
      };
      
      document.getElementById('closeModal').onclick = closeModal;
      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };
    }
  };

  const handleSaveResponse = async () => {
    // Validierung
    const isMapQuestion = ['map_drawing', 'point_marking', 'audio_perception'].includes(currentQuestion.type || 'map_drawing');
    
    if (isMapQuestion) {
      if (polygons.length === 0) {
        alert(t('please_draw_something') || 'Bitte zeichnen Sie mindestens ein Element!');
        return;
      }
    } else if (currentQuestion.type === 'instruction') {
      // Instructions don't need validation
    } else if ((currentQuestion.required !== false) && (!answer || (Array.isArray(answer) && answer.length === 0))) {
      alert(t('please_answer_question') || 'Bitte beantworten Sie die Frage!');
      return;
    }

    // Erstelle Teilnehmer nur beim ersten Speichern
    let currentParticipantCode = participantCode;
    if (!currentParticipantCode) {
      currentParticipantCode = await createParticipant();
      setParticipantCode(currentParticipantCode); // Update the state
    }

    try {
      const payload = {
        participantId: currentParticipantCode,
        questionId: currentQuestion.id
      };

      if (isMapQuestion) {
        console.log('Speichere Polygone:', polygons);
        
        const features = polygons.map((layer, index) => {
          try {
            const geoJSON = layer.toGeoJSON();
            return {
              type: "Feature",
              properties: { id: index + 1 },
              geometry: geoJSON
            };
          } catch (geoError) {
            console.error(`Fehler beim Konvertieren von Layer ${index + 1}:`, geoError);
            // Fallback logic
            if (layer instanceof L.Marker) {
               const latlng = layer.getLatLng();
               return {
                  type: "Feature",
                  properties: { id: index + 1 },
                  geometry: {
                     type: "Point",
                     coordinates: [latlng.lng, latlng.lat]
                  }
               };
            } else if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
               // Fallback: Verwende die Koordinaten direkt
               const latLngs = layer.getLatLngs()[0]; // Erste Ring für Polygon
               return {
                  type: "Feature",
                  properties: { id: index + 1 },
                  geometry: {
                     type: "Polygon",
                     coordinates: [latLngs.map(latlng => [latlng.lng, latlng.lat])]
                  }
               };
            }
            return null;
          }
        }).filter(f => f !== null);

        payload.geometry = {
          type: "FeatureCollection",
          features: features
        };
      } else {
        // Speichere normale Antwortdaten
        payload.answerData = answer;
      }

      // Update local responses for filtering
      const updatedResponses = { ...allResponses, [currentQuestion.id]: answer };
      setAllResponses(updatedResponses);

      if (isPreview) {
        console.log('Preview Mode: Skipping save. Payload:', payload);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        handleNextQuestion(updatedResponses);
        return;
      }

      await axios.post('/api/responses', payload);
      
      handleNextQuestion(updatedResponses);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert(t('error_saving_response') || 'Fehler beim Speichern der Antwort. Bitte versuchen Sie es erneut.');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        {t('loading_study')}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>❌ {t('error')}</h1>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {t('back')}
        </button>
      </div>
    );
  }

  if (showAccessCodeForm) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>🔐 {t('access_code')}</h1>
          <p style={{ textAlign: 'center', marginBottom: '30px', color: '#6c757d' }}>
            {t('access_code_required')}
          </p>
          
          {error && (
            <div style={{
              padding: '10px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '1px solid #f5c6cb',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleAccessCodeSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                {t('enter_access_code')}
              </label>
              <input
                type="text"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                placeholder={t('enter_access_code')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              {t('continue')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!study) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        {t('study_not_found')}
      </div>
    );
  }

  // Einwilligungserklärung (Consent Form)
  const showConsent = study && (study.config.consentEnabled !== false) && !consentAccepted;
  const consentTitle = study?.config?.consentTitle || t('consent_title');
  const consentText = study?.config?.consentText || t('consent_text');
  
  if (showConsent) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
            📝 {consentTitle}
          </h1>
          
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '30px',
            lineHeight: '1.6',
            color: '#495057',
            whiteSpace: 'pre-wrap'
          }}>
            {consentText}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px', 
              cursor: 'pointer',
              padding: '15px',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
              backgroundColor: '#fff'
            }}>
              <input
                type="checkbox"
                style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                onChange={(e) => {
                  setConsentChecked(e.target.checked);
                }}
              />
              <span style={{ fontSize: '18px', fontWeight: '500' }}>{t('consent_accept')}</span>
            </label>
            
            <button
              disabled={!consentChecked}
              onClick={() => setConsentAccepted(true)}
              style={{
                padding: '15px 30px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: consentChecked ? 'pointer' : 'not-allowed',
                opacity: consentChecked ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
            >
              {t('consent_continue')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {isPreview && (
        <div style={{
          backgroundColor: '#ffc107',
          color: '#212529',
          padding: '10px',
          textAlign: 'center',
          fontWeight: 'bold',
          borderBottom: '1px solid #dee2e6',
          position: 'sticky',
          top: 0,
          zIndex: 9999
        }}>
          ⚠️ {t('preview_mode') || 'VORSCHAU-MODUS - Daten werden nicht gespeichert'}
        </div>
      )}
      {/* Ausblendbare Anleitung */}
      {showInstructions && (
        <div className="instructions-overlay">
          <div className="instructions-content">
            <div className="instructions-header">
              <h3>{t('drawing_instructions')}</h3>
              <button 
                className="close-instructions"
                onClick={() => setShowInstructions(false)}
              >
                ×
              </button>
            </div>
            <ol>
              <li>{t('instruction_1')}</li>
              <li><strong>{t('instruction_2')}</strong></li>
              <li><strong>{t('instruction_3')}</strong></li>
              <li><strong>{t('instruction_4')}</strong></li>
              <li><strong>{t('instruction_5')}</strong></li>
              <li>{t('instruction_6')}</li>
            </ol>
            <p className="tip">💡 {t('drawing_tip')}</p>
          </div>
        </div>
      )}

      {/* Audio-Player (falls Audio-Frage) */}
      {currentQuestion && currentQuestion.audioFile && (
        <div className="audio-panel">
          <div className="audio-content">
            <span className="audio-label">🎵 Audio-Wahrnehmung:</span>
            <audio controls className="audio-player">
              <source src={`/uploads/audio/${currentQuestion.audioFile}`} type="audio/mpeg" />
              <source src={`/uploads/audio/${currentQuestion.audioFile}`} type="audio/wav" />
              <source src={`/uploads/audio/${currentQuestion.audioFile}`} type="audio/ogg" />
              {t('audio_not_supported')}
            </audio>
            <span className="audio-tip">{t('audio_tip')}</span>
          </div>
        </div>
      )}

      <div className="app-header">
        <div className="header-left">
          {currentQuestion && (
            <div className="question-info">
              <span className="question-counter">
                {t('question')} {currentQuestionIndex + 1} {t('of')} {questions.length}
              </span>
              <h2 className="question-text">{currentQuestion.text}</h2>
            </div>
          )}
        </div>
        
        <div className="header-right">
          {/* Teilnehmercode oben rechts */}
          {participantCode && (
            <div className="participant-code-header">
              <span>Code: {participantCode}</span>
              <button
                className="copy-code-btn"
                onClick={() => {
                  navigator.clipboard.writeText(participantCode).then(() => {
                    // Kurzes visuelles Feedback
                    const btn = document.querySelector('.copy-code-btn');
                    const originalText = btn.textContent;
                    btn.textContent = '✓';
                    btn.style.color = '#28a745';
                    setTimeout(() => {
                      btn.textContent = originalText;
                      btn.style.color = '';
                    }, 1000);
                  }).catch(err => {
                    console.error('Fehler beim Kopieren:', err);
                    alert(t('save_error'));
                  });
                }}
                title={t('copy_code')}
              >
                📋
              </button>
            </div>
          )}
          
          <div className="status-info">
            <span className="polygon-count">
              {polygons.length} {
                currentQuestion?.type === 'point_marking' 
                  ? (polygons.length !== 1 ? 'Punkte' : 'Punkt')
                  : (polygons.length !== 1 ? t('polygons') : t('polygon'))
              }
            </span>
            <span className={`drawing-status ${isDrawing ? 'active' : ''}`}>
              {isDrawing ? (currentQuestion?.type === 'point_marking' ? 'Markieren aktiv' : t('drawing_active')) : t('ready')}
            </span>
          </div>
          
          <div className="action-buttons">
            <button
              className="btn-instructions"
              onClick={() => setShowInstructions(!showInstructions)}
              title={t('show_hide_instructions')}
            >
              ?
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Map or Survey Question */}
      {['map_drawing', 'point_marking', 'audio_perception'].includes(currentQuestion?.type || 'map_drawing') ? (
        <div className="map-container">
          <MapContainer
            center={study.config?.mapConfig?.center || [46.5, 2.5]}
            zoom={study.config?.mapConfig?.zoom || 6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={study.config?.mapConfig?.allowZoom !== false}
            doubleClickZoom={study.config?.mapConfig?.allowZoom !== false}
            touchZoom={study.config?.mapConfig?.allowZoom !== false}
            boxZoom={study.config?.mapConfig?.allowZoom !== false}
            keyboard={study.config?.mapConfig?.allowZoom !== false}
            zoomControl={study.config?.mapConfig?.allowZoom !== false}
            minZoom={1}
            maxZoom={20}
            zoomSnap={0.25}
            zoomDelta={0.25}
            wheelPxPerZoomLevel={120}
          >
            <TileLayer
              attribution={getTileLayerAttribution(study.config?.mapConfig?.basemap || 'openstreetmap')}
              url={getTileLayerUrl(study.config?.mapConfig?.basemap || 'openstreetmap')}
            />
            <MapDrawingLayer 
              onPolygonsChange={setPolygons}
              onDrawingChange={setIsDrawing}
              currentQuestion={currentQuestion}
            />
          </MapContainer>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f8f9fa' }}>
          {currentQuestion?.type === 'text_input' && (
             <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <textarea 
                   value={answer || ''}
                   onChange={(e) => {
                     const val = e.target.value;
                     if (!currentQuestion.maxLength || val.length <= currentQuestion.maxLength) {
                       setAnswer(val);
                     }
                   }}
                   maxLength={currentQuestion.maxLength}
                   style={{ width: '100%', minHeight: '150px', padding: '15px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '16px' }}
                   placeholder={t('your_answer') || 'Ihre Antwort...'}
                />
                {currentQuestion.maxLength && (
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                    {(answer || '').length} / {currentQuestion.maxLength} {t('characters') || 'Zeichen'}
                  </div>
                )}
             </div>
          )}

          {currentQuestion?.type === 'numeric_input' && (
             <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <input 
                   type="text"
                   inputMode="numeric"
                   pattern="[0-9]*"
                   value={answer || ''}
                   onChange={(e) => {
                     const val = e.target.value;
                     // Only allow digits
                     if (/^\d*$/.test(val)) {
                       if (!currentQuestion.maxLength || val.length <= currentQuestion.maxLength) {
                         setAnswer(val);
                       }
                     }
                   }}
                   style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '16px' }}
                   placeholder={t('your_number') || 'Bitte Zahl eingeben...'}
                />
                {currentQuestion.maxLength && (
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                    {(answer || '').length} / {currentQuestion.maxLength} {t('digits') || 'Ziffern'}
                  </div>
                )}
             </div>
          )}

          {currentQuestion?.type === 'single_choice' && (
             <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                {(currentQuestion.options || []).map((option, idx) => (
                   <div key={idx} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #dee2e6', borderRadius: '8px', cursor: 'pointer', backgroundColor: answer === option ? '#e7f1ff' : 'white', transition: 'background-color 0.2s' }} onClick={() => setAnswer(option)}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0, width: '100%' }}>
                         <input 
                            type="radio" 
                            name="question_option" 
                            value={option} 
                            checked={answer === option} 
                            onChange={(e) => setAnswer(e.target.value)} 
                         />
                         <span style={{ fontSize: '16px' }}>{option}</span>
                      </label>
                   </div>
                ))}
             </div>
          )}

          {currentQuestion?.type === 'multiple_choice' && (
             <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                {(currentQuestion.options || []).map((option, idx) => (
                   <div key={idx} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #dee2e6', borderRadius: '8px', cursor: 'pointer', backgroundColor: (answer || []).includes(option) ? '#e7f1ff' : 'white', transition: 'background-color 0.2s' }} 
                        onClick={() => {
                           const currentAnswers = Array.isArray(answer) ? answer : [];
                           if (currentAnswers.includes(option)) {
                              setAnswer(currentAnswers.filter(a => a !== option));
                           } else {
                              setAnswer([...currentAnswers, option]);
                           }
                        }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0, width: '100%' }}>
                         <input 
                            type="checkbox" 
                            value={option} 
                            checked={(answer || []).includes(option)} 
                            onChange={() => {}} // Handled by div click
                         />
                         <span style={{ fontSize: '16px' }}>{option}</span>
                      </label>
                   </div>
                ))}
             </div>
          )}

          {currentQuestion?.type === 'likert' && (
             <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '10px' }}>
                  {(currentQuestion.options || []).map((option, idx) => (
                    <div key={idx} style={{ flex: 1, minWidth: '80px', textAlign: 'center' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '10px', height: '100%' }}>
                         <input 
                            type="radio" 
                            name="likert_option" 
                            value={option} 
                            checked={answer === option} 
                            onChange={(e) => setAnswer(e.target.value)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                         />
                         <span style={{ fontSize: '14px', wordBreak: 'break-word' }}>{option}</span>
                      </label>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {currentQuestion?.type === 'slider' && (
             <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                   <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{answer ?? currentQuestion.min ?? 0}</span>
                </div>
                <input 
                   type="range" 
                   min={currentQuestion.min ?? 0}
                   max={currentQuestion.max ?? 100}
                   step={currentQuestion.step ?? 1}
                   value={answer ?? currentQuestion.min ?? 0}
                   onChange={(e) => setAnswer(Number(e.target.value))}
                   style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#6c757d', fontSize: '14px' }}>
                   <span>{currentQuestion.leftLabel || (currentQuestion.min ?? 0)}</span>
                   <span>{currentQuestion.rightLabel || (currentQuestion.max ?? 100)}</span>
                </div>
             </div>
          )}

          {currentQuestion?.type === 'date' && (
             <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
                <input 
                   type="date" 
                   value={answer || ''}
                   onChange={(e) => setAnswer(e.target.value)}
                   style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '16px' }}
                />
             </div>
          )}
          
          {currentQuestion?.type === 'instruction' && (
             <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center', fontSize: '18px', lineHeight: '1.6', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div dangerouslySetInnerHTML={{ __html: (currentQuestion.text || '').replace(/\n/g, '<br/>') }} />
             </div>
          )}
        </div>
      )}

      {/* Aktions-Panel am unteren Rand */}
      <div className="action-panel">
        <div className="action-content" style={{ justifyContent: ['map_drawing', 'point_marking'].includes(currentQuestion?.type) ? 'space-between' : 'flex-end' }}>
          {['map_drawing', 'point_marking'].includes(currentQuestion?.type) && (
            <>
              {!isDrawing ? (
                <button
                  className="action-button"
                  onClick={() => window.startDrawing && window.startDrawing()}
                >
                  {currentQuestion?.type === 'point_marking' ? 'Markieren starten' : t('start_drawing')}
                </button>
              ) : (
                <button
                  className="action-button"
                  onClick={() => window.stopDrawing && window.stopDrawing()}
                >
                  {currentQuestion?.type === 'point_marking' ? 'Markieren beenden' : t('stop_drawing')}
                </button>
              )}
              
              <button
                className="action-button secondary"
                onClick={() => window.clearPolygons && window.clearPolygons()}
                disabled={polygons.length === 0}
              >
                {t('clear_all')}
              </button>
            </>
          )}
          
          <button
            className="action-button primary"
            onClick={handleSaveResponse}
            disabled={['map_drawing', 'point_marking'].includes(currentQuestion?.type) && polygons.length === 0}
            style={{ marginLeft: 'auto' }}
          >
            {currentQuestion?.type === 'instruction' ? t('continue') || 'Weiter' : t('save_and_continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Map Drawing Component - Freihand-Zeichnen wie SDATS
function MapDrawingLayer({ onPolygonsChange, onDrawingChange, currentQuestion }) {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [polygons, setPolygons] = useState([]);
  const polygonsRef = React.useRef(polygons); // Ref to track current polygons
  const [points, setPoints] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Sync ref with state
  useEffect(() => {
    polygonsRef.current = polygons;
  }, [polygons]);

  // Polygone von der Karte entfernen, wenn sich die Frage ändert
  useEffect(() => {
    // Alle bestehenden Polygone von der Karte entfernen
    polygons.forEach(polygon => {
      if (map.hasLayer(polygon)) {
        map.removeLayer(polygon);
      }
    });
    
    // Aktuellen Pfad entfernen, falls vorhanden
    if (currentPath && map.hasLayer(currentPath)) {
      map.removeLayer(currentPath);
      setCurrentPath(null);
    }
    
    // State zurücksetzen
    setPolygons([]);
    setPoints([]);
    setIsDrawing(false);
    setIsMouseDown(false);
    onPolygonsChange([]);
    onDrawingChange(false);
    
    // Cursor zurücksetzen
    if (map.getContainer()) {
      map.getContainer().style.cursor = '';
    }
    
    // Karten-Navigation wieder aktivieren
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
  }, [currentQuestion?.id]); // Nur ausführen, wenn sich die Fragen-ID ändert

  useMapEvents({
    // Mouse Events
    mousedown: (e) => {
      if (isDrawing && currentQuestion.type !== 'point_marking') {
        startDrawingAt(e.latlng);
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
      }
    },
    
    mousemove: (e) => {
      if (isDrawing && isMouseDown && currentPath && currentQuestion.type !== 'point_marking') {
        const newPoints = [...points, e.latlng];
        setPoints(newPoints);
        currentPath.setLatLngs(newPoints);
        
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
      }
    },
    
    mouseup: (e) => {
      if (isDrawing && isMouseDown && currentQuestion.type !== 'point_marking') {
        finishDrawing();
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
      }
    },

    click: (e) => {
      if (isDrawing && currentQuestion.type === 'point_marking') {
        const marker = L.marker(e.latlng).addTo(map);
        
        // Klick-Event für einzelnes Löschen hinzufügen
        marker.on('click', () => {
          deletePolygon(marker);
        });

        const newPolygons = [...polygons, marker];
        setPolygons(newPolygons);
        onPolygonsChange(newPolygons);
      }
    }
  });

  // Hilfsfunktionen für Zeichnen
  const startDrawingAt = (latlng) => {
    // Karten-Navigation deaktivieren
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    
    setIsMouseDown(true);
    setPoints([latlng]);
    
    // Neuen Pfad starten
    const newPath = L.polyline([latlng], {
      color: 'red',
      weight: 3,
      opacity: 0.8
    }).addTo(map);
    setCurrentPath(newPath);
  };

  const deletePolygon = (polygonToDelete) => {
    // Polygon von der Karte entfernen
    map.removeLayer(polygonToDelete);
    
    // Polygon aus der Liste entfernen (nutze Ref für aktuellen State)
    const updatedPolygons = polygonsRef.current.filter(polygon => polygon !== polygonToDelete);
    setPolygons(updatedPolygons);
    onPolygonsChange(updatedPolygons);
  };

  const finishDrawing = () => {
    setIsMouseDown(false);
    
    if (points.length >= 3) {
      // Pfad zu Polygon konvertieren
      const finalPolygon = L.polygon(points, {
        color: 'blue',
        weight: 2,
        fillColor: 'blue',
        fillOpacity: 0.3
      }).addTo(map);
      
      // Klick-Event für einzelnes Löschen hinzufügen
      finalPolygon.on('click', () => {
        deletePolygon(finalPolygon);
      });
      
      // Hover-Effekte für bessere UX
      finalPolygon.on('mouseover', function() {
        this.setStyle({
          color: 'red',
          weight: 3,
          fillOpacity: 0.5
        });
      });
      
      finalPolygon.on('mouseout', function() {
        this.setStyle({
          color: 'blue',
          weight: 2,
          fillOpacity: 0.3
        });
      });

      // Temporären Pfad entfernen
      if (currentPath) {
        map.removeLayer(currentPath);
      }
      
      const newPolygons = [...polygons, finalPolygon];
      setPolygons(newPolygons);
      onPolygonsChange(newPolygons);
      
      // Reset für nächste Zeichnung
      setPoints([]);
      setCurrentPath(null);
      setIsDrawing(false);
      onDrawingChange(false);
      
      // Cursor zurücksetzen
      map.getContainer().style.cursor = '';
    } else {
      // Zu wenige Punkte - Zeichnung abbrechen
      if (currentPath) {
        map.removeLayer(currentPath);
        setCurrentPath(null);
      }
      setPoints([]);
      setIsDrawing(false);
      onDrawingChange(false);
      map.getContainer().style.cursor = '';
    }
    
    // Karten-Navigation wieder aktivieren
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
  };

  const startDrawing = () => {
    setIsDrawing(true);
    onDrawingChange(true);
    setPoints([]);
    setCurrentPath(null);
    setIsMouseDown(false);
    // Zeichen-Cursor
    map.getContainer().style.cursor = 'crosshair';
    
    // Karten-Navigation deaktivieren für Zeichenmodus NUR bei Polygonen
    if (currentQuestion.type !== 'point_marking') {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();
        map.touchZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    onDrawingChange(false);
    setPoints([]);
    setCurrentPath(null);
    setIsMouseDown(false);
    
    // Cursor zurücksetzen
    map.getContainer().style.cursor = '';
    
    // Karten-Navigation wieder aktivieren
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
  };

  const clearPolygons = () => {
    polygons.forEach(polygon => map.removeLayer(polygon));
    setPolygons([]);
    onPolygonsChange([]);
  };

  // Globale Funktionen für die Buttons verfügbar machen
  useEffect(() => {
    window.startDrawing = startDrawing;
    window.stopDrawing = stopDrawing;
    window.clearPolygons = clearPolygons;
    window.isDrawing = isDrawing;
  }, [isDrawing, startDrawing, stopDrawing, clearPolygons]);

  return null;
}

export default PublicSurvey;
