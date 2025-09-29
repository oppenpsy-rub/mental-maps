import React, { useState, useEffect } from 'react';
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

function PublicSurvey({ studyId, accessCode, setAccessCode }) {
  const { t, i18n } = useTranslation();
  const [study, setStudy] = useState(null);
  const [participantCode, setParticipantCode] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [polygons, setPolygons] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false);
  const [languageChanged, setLanguageChanged] = useState(false);

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
      
      const response = await axios.get(`/api/studies/${studyId}/public`);
      console.log('=== API RESPONSE ===');
      console.log('Response data:', response.data);
      console.log('Language in config:', response.data.config?.language);
      
      // Prüfe, ob Zugangsschlüssel erforderlich ist
      if (response.data.requiresAccessCode && !accessCode) {
        console.log('Access code required, showing form');
        setShowAccessCodeForm(true);
        setLoading(false);
        return;
      }

      // Prüfe Zugangsschlüssel, falls erforderlich
      if (response.data.requiresAccessCode && accessCode) {
        console.log('Verifying access code');
        const accessResponse = await axios.post(`/api/studies/${studyId}/verify-access`, {
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
      setStudy(response.data);
      setQuestions(response.data.config.questions || []);
      if (response.data.config.questions && response.data.config.questions.length > 0) {
        setCurrentQuestion(response.data.config.questions[0]);
      }
      
      // Sprache basierend auf Studienkonfiguration setzen
      if (response.data.config && response.data.config.language) {
        console.log('=== LANGUAGE CHANGE START ===');
        console.log('Changing language to:', response.data.config.language);
        console.log('Available languages:', Object.keys(i18n.options.resources));
        console.log('Current language before change:', i18n.language);
        await i18n.changeLanguage(response.data.config.language);
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
    loadStudy();
  }, [studyId, accessCode]);

  const createParticipant = async () => {
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
    // Lade Studie mit dem neuen Zugangsschlüssel
    window.location.reload();
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      setPolygons([]);
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

  const handleSavePolygons = async () => {
    if (polygons.length === 0) {
      alert('Bitte zeichnen Sie mindestens ein Polygon!');
      return;
    }

    // Erstelle Teilnehmer nur beim ersten Speichern von Polygonen
    let currentParticipantCode = participantCode;
    if (!currentParticipantCode) {
      currentParticipantCode = await createParticipant();
      setParticipantCode(currentParticipantCode); // Update the state
    }

    try {
      console.log('Speichere Polygone:', polygons);
      
      const features = polygons.map((polygon, index) => {
        try {
          const geoJSON = polygon.toGeoJSON();
          console.log(`Polygon ${index + 1} GeoJSON:`, geoJSON);
          return {
            type: "Feature",
            properties: { id: index + 1 },
            geometry: geoJSON
          };
        } catch (geoError) {
          console.error(`Fehler beim Konvertieren von Polygon ${index + 1}:`, geoError);
          // Fallback: Verwende die Koordinaten direkt
          const latLngs = polygon.getLatLngs()[0]; // Erste Ring für Polygon
          return {
            type: "Feature",
            properties: { id: index + 1 },
            geometry: {
              type: "Polygon",
              coordinates: [latLngs.map(latlng => [latlng.lng, latlng.lat])]
            }
          };
        }
      });

      await axios.post('/api/responses', {
        participantId: currentParticipantCode,
        questionId: currentQuestion.id,
        geometry: {
          type: "FeatureCollection",
          features: features
        }
      });
      
      handleNextQuestion();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert(t('save_error'));
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

  return (
    <div className="App">
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
      {currentQuestion && currentQuestion.type === 'audio_perception' && currentQuestion.audioFile && (
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
              {polygons.length} {polygons.length !== 1 ? t('polygons') : t('polygon')}
            </span>
            <span className={`drawing-status ${isDrawing ? 'active' : ''}`}>
              {isDrawing ? t('drawing_active') : t('ready')}
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

      {/* Aktions-Panel am unteren Rand */}
      <div className="action-panel">
        <div className="action-content">
          {!isDrawing ? (
            <button
              className="action-button"
              onClick={() => window.startDrawing()}
            >
              {t('start_drawing')}
            </button>
          ) : (
            <button
              className="action-button"
              onClick={() => window.stopDrawing()}
            >
              {t('stop_drawing')}
            </button>
          )}
          
          <button
            className="action-button secondary"
            onClick={() => window.clearPolygons()}
            disabled={polygons.length === 0}
          >
            {t('clear_all')}
          </button>
          
          <button
            className="action-button primary"
            onClick={handleSavePolygons}
            disabled={polygons.length === 0}
          >
            {t('save_and_continue')}
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
  const [points, setPoints] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);

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
      if (isDrawing) {
        startDrawingAt(e.latlng);
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
      }
    },
    
    mousemove: (e) => {
      if (isDrawing && isMouseDown && currentPath) {
        const newPoints = [...points, e.latlng];
        setPoints(newPoints);
        currentPath.setLatLngs(newPoints);
        
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
      }
    },
    
    mouseup: (e) => {
      if (isDrawing && isMouseDown) {
        finishDrawing();
        e.originalEvent.stopPropagation();
        e.originalEvent.preventDefault();
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
    
    // Polygon aus der Liste entfernen
    const updatedPolygons = polygons.filter(polygon => polygon !== polygonToDelete);
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
    
    // Karten-Navigation deaktivieren für Zeichenmodus
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
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
