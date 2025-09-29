import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import axios from 'axios';
import StudyManagerUnified from './StudyManagerUnified';
import Admin from './Admin';
import PublicSurvey from './PublicSurvey';
import { AuthProvider, useAuth } from './Auth';
import Login from './Login';
import Profile from './Profile';

// Leaflet Icons für React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Admin Route Component
function AdminRoute() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return (
    <StudyManagerUnified 
      onBack={() => navigate('/')}
      currentUser={currentUser}
    />
  );
}

// Audio Admin Route Component
function AudioAdminRoute() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <Admin onBack={() => navigate('/admin')} />;
}

// Login Route Component
function LoginRoute() {
  const { currentUser } = useAuth();
  
  if (currentUser) {
    return <Navigate to="/admin" replace />;
  }
  
  return <Login />;
}

// Profile Route Component
function ProfileRoute() {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <Profile />;
}

// Survey Route Component
function SurveyRoute() {
  const { surveyId } = useParams();
  return <PublicSurvey studyId={surveyId} />;
}

// Home Route Component
function HomeRoute() {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [participantCode, setParticipantCode] = useState(null);
  const [currentStudy, setCurrentStudy] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [polygons, setPolygons] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const loadStudy = useCallback(async () => {
    try {
      // Lade die erste verfügbare Studie
      const studiesResponse = await axios.get('/api/studies');
      const studies = studiesResponse.data;
      
      if (studies.length === 0) {
        console.log('No studies available');
        return;
      }

      const firstStudy = studies[0];
      const response = await axios.get(`/api/studies/${firstStudy.id}`);
      const study = response.data;
      
      if (study.config && study.config.questions) {
        setQuestions(study.config.questions);
        setCurrentStudy(study);
        if (study.config.questions.length > 0) {
          setCurrentQuestion(study.config.questions[0]);
        }
        console.log('Studie geladen:', study.name);
      } else {
        console.error('Study has no valid questions');
      }
      
      // Teilnehmer wird erst beim ersten Speichern von Polygonen erstellt
      
    } catch (error) {
      console.error('Fehler beim Laden der Studie:', error);
    }
  }, []);

  // Studie laden
  useEffect(() => {
    loadStudy();
  }, [loadStudy]);

  const createParticipant = async (studyId) => {
    try {
      const response = await axios.post('/api/participants', {
        studyId: studyId
      });
      const newCode = response.data.code;
      setParticipantCode(newCode);
      return newCode;
    } catch (error) {
      console.error('Fehler beim Erstellen des Teilnehmers:', error);
      const fallbackCode = 'DEMO-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setParticipantCode(fallbackCode);
      return fallbackCode;
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      setPolygons([]);
    } else {
      // Use a more user-friendly completion message instead of alert
      const completionMessage = `${t('survey_completed')} ${t('participant_code')}: ${participantCode}`;
      
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
        <h2 style="color: #28a745; margin-bottom: 20px;">✅ ${t('survey_completed')}</h2>
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
      alert(t('draw_at_least_one_polygon'));
      return;
    }

    // Erstelle Teilnehmer nur beim ersten Speichern von Polygonen
    let currentParticipantCode = participantCode;
    if (!currentParticipantCode && currentStudy) {
      currentParticipantCode = await createParticipant(currentStudy.id);
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

  const handleDeletePolygons = () => {
    setPolygons([]);
    window.clearAllPolygons && window.clearAllPolygons();
  };

  // Zeige Loading-Zustand wenn noch keine Studie geladen ist
  if (!currentStudy || !currentQuestion) {
    return (
      <div className="App">
        <div className="app-header">
          <div className="header-left">
            <div className="question-info">
              <span className="question-counter">{t('loading_study')}</span>
              <h2 className="question-text">{t('please_wait')}</h2>
            </div>
          </div>
        </div>
        <div className="map-container" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ecf0f1'}}>
          <p>{t('study_loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Professioneller Header über der Karte */}
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
          {/* Für Teilnehmer: Teilnehmercode oben rechts */}
          {!currentUser && participantCode && (
            <div className="participant-code-header">
              {t('code')}: {participantCode}
            </div>
          )}
          
          <div className="status-info">
            <span className="polygon-count">{polygons.length} {t('polygon')}{polygons.length !== 1 ? 'e' : ''}</span>
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
            
            {/* Nur für eingeloggte Forscher sichtbar */}
            {currentUser && (
              <>
                <button
                  className="btn-admin"
                  onClick={() => navigate('/admin/audio')}
                  title={t('audio_management')}
                >
                  Audio
                </button>
                <button
                  className="btn-studies"
                  onClick={() => navigate('/admin')}
                  title={t('study_management')}
                >
                  {t('studies')}
                </button>
                <button
                  className="btn-logout"
                  onClick={() => logout()}
                  title={t('logout')}
                >
                  {t('logout')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Instructions */}
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

      {/* Audio Player (if audio question) */}
      {currentQuestion && currentQuestion.type === 'audio_perception' && currentQuestion.audioFile && (
        <div className="audio-panel">
          <div className="audio-content">
            <span className="audio-label">🎵 {t('audio_perception')}:</span>
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

      {/* Main Map */}
      <div className="map-container">
        <MapContainer
          center={[46.5, 2.5]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={!isDrawing}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapDrawingLayer
            onPolygonsChange={setPolygons}
            onDrawingChange={setIsDrawing}
            currentQuestion={currentQuestion} />
        </MapContainer>
      </div>

      {/* Action Panel at bottom */}
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
            className="action-button danger"
            onClick={handleDeletePolygons}
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

      {/* Participant Code (only visible for researchers in footer) */}
      {currentUser && participantCode && (
        <div className="participant-code">
          {t('code')}: {participantCode}
        </div>
      )}

      {/* Footer with Copyright and Login */}
      {!currentUser && (
        <footer className="app-footer">
          <div className="footer-content">
            <span className="copyright">Platzhalter © 2025</span>
            <button
              className="login-button"
              onClick={() => navigate('/admin/login')}
            >
              {t('login')}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

// Map Drawing Component - Freehand drawing like SDATS
function MapDrawingLayer({ onPolygonsChange, onDrawingChange, currentQuestion }) {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [polygons, setPolygons] = useState([]);
  const [points, setPoints] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);

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
  const startDrawingAt = useCallback((latlng) => {
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
  }, [map]);

  const deletePolygon = useCallback((polygonToDelete) => {
    // Polygon von der Karte entfernen
    map.removeLayer(polygonToDelete);
    
    // Polygon aus der Liste entfernen
    const updatedPolygons = polygons.filter(polygon => polygon !== polygonToDelete);
    setPolygons(updatedPolygons);
    onPolygonsChange(updatedPolygons);
  }, [polygons, map, onPolygonsChange]);

  const finishDrawing = useCallback(() => {
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
  }, [points, currentPath, polygons, map, onPolygonsChange, onDrawingChange, deletePolygon]);

  const startDrawing = useCallback(() => {
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
  }, [map, onDrawingChange]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    onDrawingChange(false);
    setPoints([]);
    if (currentPath) {
      map.removeLayer(currentPath);
      setCurrentPath(null);
    }
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
  }, [map, onDrawingChange, currentPath]);

  const clearPolygons = useCallback(() => {
    polygons.forEach(polygon => map.removeLayer(polygon));
    setPolygons([]);
    onPolygonsChange([]);
  }, [polygons, map, onPolygonsChange]);

  // Globale Funktionen für die Buttons verfügbar machen
  useEffect(() => {
    window.startDrawing = startDrawing;
    window.stopDrawing = stopDrawing;
    window.clearAllPolygons = clearPolygons;
    window.isDrawing = isDrawing;
  }, [isDrawing, startDrawing, stopDrawing, clearPolygons]);

  return null;
}

// Main App Component with Router
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Öffentliche Startseite */}
          <Route path="/" element={<HomeRoute />} />
          
          {/* Öffentliche Umfragen */}
          <Route path="/survey/:surveyId" element={<SurveyRoute />} />
          
          {/* Admin-Bereich */}
          <Route path="/admin/login" element={<LoginRoute />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/admin/profile" element={<ProfileRoute />} />
          <Route path="/admin/audio" element={<AudioAdminRoute />} />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
