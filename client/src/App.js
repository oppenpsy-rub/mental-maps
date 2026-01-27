import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import axios from 'axios';
import StudyManagerUnified from './StudyManagerUnified';
import Admin from './Admin';
import PublicSurvey from './PublicSurvey';
import UserManagement from './UserManagement';
import { AuthProvider, useAuth } from './Auth';
import Login from './Login';
import Profile from './Profile';
import MentalMapAnalysis from './components/Analysis/MentalMapAnalysis';
import { Lightbulb, Music, X, MapPin, CheckCircle2, BarChart3, Globe, Lock, Smartphone } from 'lucide-react';
import './landing.css';
import './responsive-utilities.css';

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

// Analysis Route Component
function AnalysisRoute() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { studyId } = useParams();
  
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <MentalMapAnalysis studyId={studyId} onBack={() => navigate('/admin')} />;
}

// User Management Route Component
function UserManagementRoute() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <UserManagement onBack={() => navigate('/admin')} />;
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

// Demo study data for homepage preview
const DEMO_STUDY = {
  id: "demo-study",
  name: "Demo: VOICE Mental Maps - English Language Perception Study",
  description: "This is a demonstration of VOICE Mental Maps with sample questions about English language perceptions. Your responses will not be saved.",
  config: {
    questions: [
      {
        id: 1,
        text: "Where is the most beautiful English spoken? Mark areas on the map where you think the most beautiful English is spoken.",
        description: "Draw areas on the map where you believe the most aesthetically pleasing or beautiful English is spoken.",
        type: "polygon"
      },
      {
        id: 2,
        text: "Where is the most correct English spoken? Mark areas on the map where you think the most correct English is spoken.",
        description: "Draw areas on the map where you believe the most grammatically correct or standard English is spoken.",
        type: "polygon"
      },
      {
        id: 3,
        text: "Where is the ugliest English spoken? Mark areas on the map where you think the ugliest English is spoken.",
        description: "Draw areas on the map where you believe the least aesthetically pleasing English is spoken.",
        type: "polygon"
      }
    ]
  }
};

// Home Route Component
function HomeRoute() {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const [participantCode, setParticipantCode] = useState(null);
  const [currentStudy, setCurrentStudy] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [polygons, setPolygons] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const loadDemoStudy = useCallback(() => {
    try {
      // Use demo study instead of loading from database
      setQuestions(DEMO_STUDY.config.questions);
      setCurrentStudy(DEMO_STUDY);
      if (DEMO_STUDY.config.questions.length > 0) {
        setCurrentQuestion(DEMO_STUDY.config.questions[0]);
      }
      console.log('Demo study loaded:', DEMO_STUDY.name);
      
      // Set a demo participant code
      const demoCode = 'DEMO-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      setParticipantCode(demoCode);
      setShowDemo(true);
      
    } catch (error) {
      console.error('Error loading demo study:', error);
    }
  }, []);

  // Load demo study on component mount
  useEffect(() => {
    if (showDemo) {
      loadDemoStudy();
    }
  }, [showDemo, loadDemoStudy]);

  // Remove the old loadStudy call - we only want demo study on homepage
  // const loadStudy = useCallback(async () => {
  //   try {
  //     // Lade die erste verfügbare Studie
  //     const studiesResponse = await axios.get('/api/studies');
  //     const studies = studiesResponse.data;
  //     
  //     if (studies.length === 0) {
  //       console.log('No studies available');
  //       return;
  //     }
  // 
  //     const firstStudy = studies[0];
  //     const response = await axios.get(`/api/studies/${firstStudy.id}`);
  //     const study = response.data;
  //     
  //     if (study.config && study.config.questions) {
  //       setQuestions(study.config.questions);
  //       setCurrentStudy(study);
  //       if (study.config.questions.length > 0) {
  //         setCurrentQuestion(study.config.questions[0]);
  //       }
  //       console.log('Studie geladen:', study.name);
  //     } else {
  //       console.error('Study has no valid questions');
  //     }
  //     
  //     // Teilnehmer wird erst beim ersten Speichern von Polygonen erstellt
  //     
  //   } catch (error) {
  //     console.error('Fehler beim Laden der Studie:', error);
  //   }
  // }, []);
  
  // Studie laden
  // useEffect(() => {
  //   loadStudy();
  // }, [loadStudy]);

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
      // VORSCHAU-MODUS: Zeige Hinweis statt echten Abschluss
      const modal = document.createElement('div');
      modal.className = 'preview-modal';
      
      const content = document.createElement('div');
      content.className = 'preview-content';
      
      content.innerHTML = `
        <h2 class="preview-title">Preview completed</h2>
        <p class="preview-text">
          You have completed the preview version.<br>
          <strong>No data was saved.</strong>
        </p>
        <button id="closeModal" class="btn-close-modal">Got it</button>
      `;
      
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      // Close modal when clicking OK or outside
      const closeModal = () => {
        document.body.removeChild(modal);
        // Zurück zur ersten Frage für weitere Vorschau
        setCurrentQuestionIndex(0);
        setCurrentQuestion(questions[0]);
        setPolygons([]);
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

    // VORSCHAU-MODUS: Keine echten Antworten speichern auf der Startseite
    console.log('VORSCHAU-MODUS: Polygone würden gespeichert werden:', polygons.length);
    alert(`Only preview to showcase the functionality - No real data is saved\n${polygons.length} polygon(s) drawn.`);
    
    // Zur nächsten Frage wechseln ohne zu speichern
    handleNextQuestion();
  };

  const handleDeletePolygons = () => {
    setPolygons([]);
    window.clearAllPolygons && window.clearAllPolygons();
  };

  // Zeige Loading-Zustand wenn noch keine Studie geladen ist
  // Show Landing Page if not in demo mode
  if (!showDemo) {
    return (
      <div className="App landing-page">
        {/* Header */}
        <header className="landing-header">
          <div className="landing-header-content">
            <div className="landing-logo">
              <h1>VOICE Mental Maps</h1>
            </div>
            <nav className="landing-nav">
              {currentUser ? (
                <>
                  <button 
                    className="landing-nav-btn"
                    onClick={() => navigate('/admin')}
                  >
                    {t('study_management')}
                  </button>
                  <button 
                    className="landing-nav-btn primary"
                    onClick={() => logout()}
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <button 
                  className="landing-nav-btn primary"
                  onClick={() => navigate('/admin/login')}
                >
                  {t('login')}
                </button>
              )}
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="landing-hero">
          <div className="landing-hero-content">
            <h2 className="landing-hero-title">Kartographie von Wahrnehmungen</h2>
            <p className="landing-hero-subtitle">Erfassen Sie räumliche Perzeptionen und mentale Karten durch interaktive, kartenbasierte Umfragen</p>
            <button 
              className="landing-cta-button"
              onClick={() => setShowDemo(true)}
            >
              Demo anschauen
            </button>
          </div>
          <div className="landing-hero-background"></div>
        </section>

        {/* Features Section */}
        <section className="landing-features">
          <div className="landing-features-container">
            <div className="landing-feature">
              <div className="landing-feature-icon">
                <MapPin size={32} />
              </div>
              <h3>Interaktive Kartierung</h3>
              <p>Teilnehmer können direkt auf einer Karte Polygone zeichnen, um ihre räumlichen Wahrnehmungen auszudrücken</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon">
                <CheckCircle2 size={32} />
              </div>
              <h3>Flexible Fragen</h3>
              <p>Unterstützt verschiedene Fragetypen: Polygone, Punkte, Mehrfachauswahl, Text und Audio-Wahrnehmung</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon">
                <BarChart3 size={32} />
              </div>
              <h3>Datenexport</h3>
              <p>Exportieren Sie Ihre Ergebnisse als GeoJSON oder CSV für die Analyse in QGIS oder anderen Tools</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon">
                <Globe size={32} />
              </div>
              <h3>Mehrsprachig</h3>
              <p>Unterstützt Deutsch, Englisch, Französisch, Italienisch, Spanisch, Portugiesisch, Rumänisch und mehr</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon">
                <Lock size={32} />
              </div>
              <h3>Sicher & Privat</h3>
              <p>Anonyme Teilnehmerverwaltung mit Zugriffscodes und sicherer Datenspeicherung</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon">
                <Smartphone size={32} />
              </div>
              <h3>Responsive Design</h3>
              <p>Funktioniert nahtlos auf Desktop, Tablet und Mobilgeräten</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="landing-cta-section">
          <div className="landing-cta-content">
            <h2>Bereit zum Starten?</h2>
            <p>Erstellen Sie Ihre erste Studie und beginnen Sie mit der Erfassung räumlicher Daten</p>
            <div className="landing-cta-buttons">
              <button 
                className="landing-button primary"
                onClick={() => navigate('/admin/login')}
              >
                {t('login')}
              </button>
              <button 
                className="landing-button secondary"
                onClick={() => setShowDemo(true)}
              >
                Demo anschauen
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <p>&copy; 2025 VOICE Mental Maps. Alle Rechte vorbehalten.</p>
        </footer>
      </div>
    );
  }

  // Demo View
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
        <div className="map-container loading-container">
          <p>{t('study_loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App public-survey">
      {/* Demo Banner */}
      <div className="demo-banner">
        <span>Demo Modus - Daten werden nicht gespeichert</span>
        <button 
          className="demo-banner-close"
          onClick={() => {
            setShowDemo(false);
            setCurrentQuestion(null);
            setCurrentStudy(null);
          }}
        >
          Zurück zur Startseite
        </button>
      </div>

      {/* Professioneller Header über der Karte */}
      <div className="survey-header">
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
                <X size={24} />
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
            <p className="tip"><Lightbulb size={16} className="me-2" /> {t('drawing_tip')}</p>
          </div>
        </div>
      )}

      {/* Audio Player (if audio question) */}
      {currentQuestion && currentQuestion.type === 'audio_perception' && currentQuestion.audioFile && (
        <div className="audio-panel">
          <div className="audio-content">
            <span className="audio-label"><Music size={20} className="me-2" /> {t('audio_perception')}:</span>
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

      {/* Content Shell */}
      <div className="content-shell">
        {/* Main Map */}
        <div className="map-container" style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0', minHeight: '400px', position: 'relative' }}>
          <div style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}>
            <MapContainer
              center={[37.0902, -95.7129]}
              zoom={4}
              className="map-full"
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
        </div>
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
          <Route path="/admin/analysis/:studyId" element={<AnalysisRoute />} />
          <Route path="/admin/profile" element={<ProfileRoute />} />
          <Route path="/admin/audio" element={<AudioAdminRoute />} />
          <Route path="/admin/users" element={<UserManagementRoute />} />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
