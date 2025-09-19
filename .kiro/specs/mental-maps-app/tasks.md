# Implementierungsplan - Mental Maps Anwendung

- [x] 1. Projektstruktur und Grundkonfiguration einrichten





  - Erstelle Monorepo-Struktur mit separaten Frontend- und Backend-Ordnern
  - Konfiguriere TypeScript, ESLint, Prettier für beide Projekte
  - Richte Package.json-Dateien mit allen erforderlichen Abhängigkeiten ein
  - Erstelle Docker-Konfiguration für Entwicklungsumgebung
  - _Anforderungen: Alle (Grundlage)_

- [x] 2. Backend-Grundstruktur und Datenbank implementieren





  - [x] 2.1 Express.js-Server mit TypeScript-Konfiguration erstellen


    - Implementiere grundlegende Express-App mit Middleware-Setup
    - Konfiguriere CORS, Body-Parser und Security-Headers
    - Erstelle Basis-Routing-Struktur
    - _Anforderungen: 12.4_
  
  - [x] 2.2 PostgreSQL-Datenbank mit PostGIS-Erweiterung einrichten


    - Erstelle Datenbankschema mit allen erforderlichen Tabellen
    - Implementiere Migrationen für Researchers, Studies, Questions, etc.
    - Konfiguriere PostGIS für Geodatenunterstützung
    - Erstelle Indizes für Performance-Optimierung
    - _Anforderungen: 4.1, 4.2_
  
  - [x] 2.3 Datenbank-Abstraktionsschicht implementieren


    - Erstelle Repository-Pattern für alle Entitäten
    - Implementiere CRUD-Operationen mit TypeORM oder Prisma
    - Schreibe Unit-Tests für Repository-Funktionen
    - _Anforderungen: 4.1, 4.2_

- [x] 3. Authentifizierung und Benutzerverwaltung implementieren





  - [x] 3.1 JWT-basierte Authentifizierung für Forscher erstellen


    - Implementiere Login/Logout-Endpunkte
    - Erstelle JWT-Token-Generierung und -Validierung
    - Implementiere Middleware für geschützte Routen
    - _Anforderungen: 12.4_
  
  - [x] 3.2 Session-basierte Authentifizierung für Probanden implementieren


    - Erstelle anonyme Session-Token für Studienteilnahme
    - Implementiere Session-Verwaltung ohne Benutzerregistrierung
    - Schreibe Tests für beide Authentifizierungsmethoden
    - _Anforderungen: 5.5, 9.2_

- [-] 4. Studienverwaltung-API implementieren




  - [x] 4.1 CRUD-Operationen für Studien erstellen




    - Implementiere Endpunkte zum Erstellen, Bearbeiten, Löschen von Studien
    - Erstelle Validierung für Studiendaten
    - Implementiere Autorisierung (nur eigene Studien bearbeitbar)
    - _Anforderungen: 1.1, 1.2, 1.3_
  
  - [x] 4.2 Fragenverwaltung für Studien implementieren





    - Erstelle Endpunkte für Fragen-CRUD-Operationen
    - Implementiere Reihenfolgen-Management für Fragen
    - Erstelle Validierung für verschiedene Fragetypen
    - _Anforderungen: 1.1, 1.4, 8.2_
  
  - [x] 4.3 Studienaktivierung und -status implementieren







    - Erstelle Endpunkte zum Aktivieren/Deaktivieren von Studien
    - Implementiere Status-Tracking und Validierung
    - Schreibe Tests für Studienverwaltung
    - _Anforderungen: 1.4_

- [x] 5. Audio-Stimuli-Verwaltung implementieren





  - [x] 5.1 Datei-Upload-Service für Audio erstellen


    - Implementiere Multer-basierte Datei-Upload-Endpunkte
    - Erstelle Validierung für Audio-Dateiformate (MP3, WAV, OGG)
    - Implementiere Dateispeicherung (lokal oder S3)
    - _Anforderungen: 7.1, 7.3_
  
  - [x] 5.2 Audio-Metadaten-Verwaltung implementieren


    - Erstelle Endpunkte für Audio-Metadaten (Sprecher, Dialekt, etc.)
    - Implementiere Audio-Datei-Verknüpfung mit Fragen
    - Erstelle Audio-Streaming-Endpunkte
    - Schreibe Tests für Audio-Funktionalität
    - _Anforderungen: 7.5, 7.6_

- [x] 6. Frontend-Grundstruktur mit React implementieren





  - [x] 6.1 React-App mit TypeScript und Routing erstellen


    - Erstelle React-App-Struktur mit React Router
    - Konfiguriere State Management (Redux Toolkit oder Zustand)
    - Implementiere grundlegende Layout-Komponenten
    - _Anforderungen: 5.1_
  
  - [x] 6.2 Authentifizierung-UI implementieren


    - Erstelle Login-Formular für Forscher
    - Implementiere geschützte Routen und Auth-Context
    - Erstelle Session-Handling für Probanden
    - _Anforderungen: 5.1_
  
  - [x] 6.3 Responsive Design-System einrichten


    - Implementiere CSS-Framework oder Styled Components
    - Erstelle responsive Layout-Komponenten
    - Teste auf verschiedenen Bildschirmgrößen
    - _Anforderungen: 5.2_

- [x] 7. Interaktive Karte mit Leaflet implementieren





  - [x] 7.1 Basis-Kartenkomponente erstellen


    - Integriere Leaflet.js in React-Komponente
    - Konfiguriere OpenStreetMap als Standard-Kartenlayer
    - Implementiere Zoom- und Pan-Funktionalität
    - _Anforderungen: 2.1, 6.1_
  
  - [x] 7.2 Verschiedene Kartenstile implementieren


    - Füge verschiedene OSM-basierte Kartenstile hinzu
    - Implementiere Kartenstil-Wechsler in der UI
    - Konfiguriere benutzerdefinierte Kartenausschnitte
    - _Anforderungen: 6.2, 6.3_
  
  - [x] 7.3 Karteninteraktion und -navigation optimieren


    - Implementiere Touch-Gesten für mobile Geräte
    - Erstelle Zoom-Level-Beschränkungen basierend auf Studieneinstellungen
    - Schreibe Tests für Karteninteraktionen
    - _Anforderungen: 2.4, 5.2_

- [x] 8. Zeichenwerkzeuge mit Fabric.js implementieren





  - [x] 8.1 Canvas-Overlay für Karte erstellen


    - Integriere Fabric.js Canvas über Leaflet-Karte
    - Implementiere Koordinaten-Synchronisation zwischen Karte und Canvas
    - Erstelle Basis-Zeichenfunktionalität
    - _Anforderungen: 2.2, 3.1_
  
  - [x] 8.2 Verschiedene Zeichenwerkzeuge implementieren


    - Erstelle Freihand-Zeichenwerkzeug (Stift)
    - Implementiere geometrische Formen (Linien, Kreise, Polygone)
    - Erstelle Text-Annotation-Werkzeug
    - _Anforderungen: 3.1, 3.2_
  
  - [x] 8.3 Werkzeug-Einstellungen und -Eigenschaften implementieren


    - Erstelle UI für Farb- und Strichstärken-Auswahl
    - Implementiere Transparenz-Einstellungen für Füllungen
    - Erstelle Werkzeug-Palette mit Vorschau
    - _Anforderungen: 3.2, 3.3_
  
  - [x] 8.4 Zeichnungs-Bearbeitung implementieren


    - Implementiere Auswahl und Verschiebung von Zeichenelementen
    - Erstelle Rückgängig/Wiederholen-Funktionalität
    - Implementiere Löschen einzelner Elemente
    - _Anforderungen: 2.5, 3.5_

- [x] 9. Heatmap-Funktionalität implementieren





  - [x] 9.1 Heatmap-Zeichenwerkzeug erstellen


    - Implementiere Intensitäts-basiertes Zeichenwerkzeug
    - Erstelle Echtzeit-Heatmap-Vorschau während der Eingabe
    - Konfiguriere verschiedene Heatmap-Parameter
    - _Anforderungen: 8.4, 11.2_
  
  - [x] 9.2 Heatmap-Analyse-Engine implementieren


    - Erstelle Backend-Service für Heatmap-Generierung
    - Implementiere verschiedene Aggregationsmethoden
    - Erstelle API-Endpunkte für Heatmap-Daten
    - _Anforderungen: 11.2, 11.3, 11.4_

- [x] 10. Audio-Player-Komponente implementieren





  - [x] 10.1 Web Audio API-Integration erstellen


    - Implementiere Audio-Player-Komponente mit Standard-Kontrollen
    - Erstelle Unterstützung für verschiedene Audio-Formate
    - Implementiere Lautstärke- und Seek-Funktionalität
    - _Anforderungen: 7.2, 7.3_
  
  - [x] 10.2 Audio-Wiedergabe-Features implementieren


    - Erstelle unbegrenzte Wiederholungs-Funktionalität
    - Implementiere Audio-Preloading für bessere Performance
    - Erstelle Visualisierung des Wiedergabe-Fortschritts
    - _Anforderungen: 7.4_

- [x] 11. Antwortsammlung und -speicherung implementieren







  - [x] 11.1 Response-Collection-API erstellen


    - Implementiere Endpunkte zum Speichern von Probandenantworten
    - Erstelle Validierung für Antwortdaten
    - Implementiere automatische Anonymisierung von PII
    - _Anforderungen: 4.1, 4.2, 9.2_

  
  - [x] 11.2 Geodaten-Serialisierung implementieren



    - Erstelle GeoJSON-Export/Import für Zeichnungen
    - Implementiere Koordinaten-Transformation zwischen Canvas und Geo-Koordinaten
    - Erstelle Datenvalidierung für Geodaten
    - _Anforderungen: 4.1_
  
  - [x] 11.3 Zwischenspeicherung und Session-Management implementieren





    - Implementiere automatische Zwischenspeicherung während der Eingabe
    - Erstelle Session-Recovery bei Verbindungsabbruch
    - Implementiere Fortschritts-Tracking
    - _Anforderungen: 5.5_

  - [x] 11.4 Studienteilnahme-Oberfläche implementieren











    - Erstelle Hauptseite für Studienteilnahme mit Session-Initialisierung
    - Implementiere Fragennavigation und Fortschrittsanzeige
    - Integriere alle Komponenten (Karte, Zeichenwerkzeuge, Audio, Demografie)
    - Erstelle Studienabschluss-Workflow mit Datenübermittlung
    - _Anforderungen: 2.1, 5.1, 5.3, 5.5_

- [x] 12. Demografische Datenerfassung implementieren








  - [x] 12.1 Demografische Formulare erstellen


    - Implementiere optionale Demografieformulare
    - Erstelle strukturierte Eingabefelder für Mehrsprachigkeit
    - Implementiere Herkunftsort-Erfassung mit Kartenauswahl
    - _Anforderungen: 9.1, 9.4_
  
  - [x] 12.2 Demografische Datenverknüpfung implementieren


    - Erstelle anonymisierte Verknüpfung zwischen Demografie und Antworten
    - Implementiere Datenvalidierung und -sanitization
    - Schreibe Tests für Demografiedaten-Handling
    - _Anforderungen: 9.2_

- [x] 13. Forscher-Dashboard implementieren





  - [x] 13.1 Studienübersicht-Dashboard erstellen


    - Implementiere Dashboard mit Studienauflistung
    - Erstelle Studien-Statistiken und Status-Anzeigen
    - Implementiere Schnellaktionen (Aktivieren, Bearbeiten, Löschen)
    - _Anforderungen: 1.1, 1.3_
  
  - [x] 13.2 Studien-Editor-Interface implementieren


    - Erstelle umfassenden Studien-Editor mit Drag-and-Drop
    - Implementiere Fragen-Reihenfolgen-Management
    - Erstelle Audio-Upload-Interface mit Metadaten-Eingabe
    - _Anforderungen: 1.1, 1.2, 7.1, 7.5_
  
  - [x] 13.3 Studien-Vorschau implementieren


    - Erstelle Vorschau-Modus für Studien vor Aktivierung
    - Implementiere Test-Durchlauf für Forscher
    - Erstelle Validierung und Fehlerprüfung vor Aktivierung
    - _Anforderungen: 1.4_

- [-] 14. Analyse-Dashboard implementieren



  - [x] 14.1 Datenvisualisierung-Komponenten erstellen


    - Implementiere Heatmap-Visualisierung mit anpassbaren Parametern
    - Erstelle Overlay-Ansichten für mehrere Antworten
    - Implementiere interaktive Zoom- und Filter-Funktionen
    - _Anforderungen: 11.2, 11.3, 11.4_
  
  - [-] 14.2 Statistische Analyse-Tools implementieren

    - Erstelle automatische Cluster-Analyse und Hotspot-Erkennung
    - Implementiere grundlegende Statistiken und Metriken
    - Erstelle Vergleichsansichten zwischen demografischen Gruppen
    - _Anforderungen: 11.1, 9.3_
  
  - [ ] 14.3 Filter- und Segmentierungs-Tools implementieren
    - Implementiere demografische Filter für Datenanalyse
    - Erstelle zeitbasierte Filter und Vergleiche
    - Implementiere benutzerdefinierte Segmentierung
    - _Anforderungen: 9.3_

- [ ] 15. Datenexport und -integration implementieren
  - [ ] 15.1 Verschiedene Export-Formate implementieren
    - Erstelle JSON/GeoJSON-Export für Rohdaten
    - Implementiere CSV-Export für statistische Analyse
    - Erstelle Bildexport für Visualisierungen
    - _Anforderungen: 4.3_
  
  - [ ] 15.2 Statistiksoftware-Integration vorbereiten
    - Erstelle R-kompatible Datenexporte
    - Implementiere SPSS-Format-Export
    - Erstelle Dokumentation für Datenstruktur
    - _Anforderungen: 11.3_

- [ ] 16. Kollaborative Features implementieren
  - [ ] 16.1 Multi-Forscher-Unterstützung implementieren
    - Erstelle Benutzerrollen und Berechtigungssystem
    - Implementiere gemeinsame Studienverwaltung
    - Erstelle Aktivitäts-Logging und Audit-Trail
    - _Anforderungen: 10.3_
  
  - [ ] 16.2 Längsschnittstudien-Support implementieren
    - Implementiere Probanden-Tracking über mehrere Sessions
    - Erstelle zeitbasierte Studienplanung
    - Implementiere automatische Einladungs-E-Mails
    - _Anforderungen: 10.1, 10.2_

- [ ] 17. Performance-Optimierung implementieren
  - [ ] 17.1 Frontend-Performance optimieren
    - Implementiere Code-Splitting und Lazy Loading
    - Optimiere Karten- und Canvas-Rendering
    - Erstelle Caching-Strategien für statische Assets
    - _Anforderungen: 12.2_
  
  - [ ] 17.2 Backend-Performance optimieren
    - Implementiere Datenbank-Query-Optimierung
    - Erstelle Caching-Layer mit Redis
    - Optimiere Geodaten-Verarbeitung
    - _Anforderungen: 12.2_

- [ ] 18. Sicherheit und DSGVO-Konformität implementieren
  - [ ] 18.1 Datenschutz-Features implementieren
    - Implementiere automatische PII-Anonymisierung
    - Erstelle Einverständniserklärung-Workflows
    - Implementiere Datenminimierung und -löschung
    - _Anforderungen: 12.1, 12.3_
  
  - [ ] 18.2 Sicherheitsmaßnahmen implementieren
    - Implementiere Rate Limiting und DDoS-Schutz
    - Erstelle Input-Validation und XSS-Schutz
    - Implementiere Audit-Logging für kritische Aktionen
    - _Anforderungen: 12.4, 12.5_

- [ ] 19. Umfassende Tests implementieren
  - [ ] 19.1 Unit-Tests für alle Komponenten schreiben
    - Erstelle Frontend-Tests mit Jest und React Testing Library
    - Schreibe Backend-Tests für alle Services und APIs
    - Implementiere Datenbank-Tests mit Testcontainers
    - _Anforderungen: Alle (Qualitätssicherung)_
  
  - [ ] 19.2 Integration- und E2E-Tests implementieren
    - Erstelle API-Integrationstests mit Supertest
    - Implementiere Browser-Tests mit Cypress
    - Erstelle Performance-Tests mit Artillery
    - _Anforderungen: Alle (Qualitätssicherung)_

- [ ] 20. Deployment und Produktionsreife implementieren
  - [ ] 20.1 Docker-Containerisierung erstellen
    - Erstelle Dockerfiles für Frontend und Backend
    - Implementiere Docker Compose für lokale Entwicklung
    - Erstelle Produktions-Docker-Konfiguration
    - _Anforderungen: 12.5_
  
  - [ ] 20.2 CI/CD-Pipeline einrichten
    - Konfiguriere automatische Tests in CI/CD
    - Implementiere automatische Deployments
    - Erstelle Monitoring und Logging-Setup
    - _Anforderungen: 12.5_