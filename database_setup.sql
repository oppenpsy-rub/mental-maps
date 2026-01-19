-- Mental Map Tool - Database Setup Script
-- Für RUB Datenbankserver
-- Erstellt alle notwendigen Tabellen für das Mental Map Tool

-- Datenbank erstellen (falls noch nicht vorhanden)
-- CREATE DATABASE IF NOT EXISTS mentalmaps CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE mentalmaps;

-- =====================================================
-- 1. STUDIES TABELLE
-- Speichert die verschiedenen Studien/Umfragen
-- =====================================================
CREATE TABLE IF NOT EXISTS studies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    config TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. USERS TABELLE
-- Speichert Forscher-Accounts mit Genehmigungsworkflow
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'researcher',
    institution VARCHAR(255),
    department VARCHAR(255),
    language VARCHAR(10) DEFAULT 'de',
    approved BOOLEAN DEFAULT FALSE,
    pending BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_approved_pending (approved, pending)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. PARTICIPANTS TABELLE
-- Speichert Teilnehmer-Codes und Zuordnungen
-- =====================================================
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    study_id INT,
    limesurvey_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (study_id) REFERENCES studies (id) ON DELETE CASCADE,
    INDEX idx_code (code),
    INDEX idx_study_id (study_id),
    INDEX idx_limesurvey_id (limesurvey_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. RESPONSES TABELLE
-- Speichert die Mental Map Antworten der Teilnehmer
-- =====================================================
CREATE TABLE IF NOT EXISTS responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT,
    question_id VARCHAR(255),
    geometry LONGTEXT,
    audio_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
    INDEX idx_participant_id (participant_id),
    INDEX idx_question_id (question_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INITIAL DATA / ADMIN USER
-- =====================================================

-- Erstelle einen Standard-Admin-Benutzer (Passwort: admin123)
-- WICHTIG: Passwort nach der ersten Anmeldung ändern!
INSERT IGNORE INTO users (name, email, password, role, approved, pending, language) 
VALUES (
    'Administrator', 
    'admin@rub.de', 
    '$2b$10$rQZ9yX8qF5K5K5K5K5K5K.K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 
    'admin', 
    TRUE, 
    FALSE, 
    'de'
);

-- =====================================================
-- VIEWS FÜR REPORTING (OPTIONAL)
-- =====================================================

-- View für Teilnehmer mit Antworten
CREATE OR REPLACE VIEW participants_with_responses AS
SELECT 
    p.id,
    p.code,
    p.study_id,
    p.limesurvey_id,
    p.created_at,
    COUNT(r.id) as response_count,
    MAX(r.created_at) as last_response_at
FROM participants p
LEFT JOIN responses r ON p.id = r.participant_id
GROUP BY p.id, p.code, p.study_id, p.limesurvey_id, p.created_at;

-- View für Studien-Statistiken
CREATE OR REPLACE VIEW study_statistics AS
SELECT 
    s.id,
    s.name,
    s.status,
    s.created_at,
    COUNT(DISTINCT p.id) as participant_count,
    COUNT(r.id) as total_responses,
    MAX(r.created_at) as last_activity
FROM studies s
LEFT JOIN participants p ON s.id = p.study_id
LEFT JOIN responses r ON p.id = r.participant_id
GROUP BY s.id, s.name, s.status, s.created_at;

-- =====================================================
-- BERECHTIGUNGEN (BEISPIEL)
-- =====================================================

-- Erstelle einen Datenbankbenutzer für die Anwendung
-- CREATE USER IF NOT EXISTS 'mentalmapsadm'@'%' IDENTIFIED BY '7UuPBc6WJWfDlwBv';

-- Gewähre notwendige Berechtigungen
-- GRANT SELECT, INSERT, UPDATE, DELETE ON mentalmaps.* TO 'mentalmapsadm'@'%';
-- GRANT CREATE TEMPORARY TABLES ON mentalmaps.* TO 'mentalmapsadm'@'%';

-- Berechtigungen anwenden
-- FLUSH PRIVILEGES;

-- =====================================================
-- SETUP ABGESCHLOSSEN
-- =====================================================

SELECT 'Mental Map Tool Datenbank erfolgreich eingerichtet!' as Status;
SELECT COUNT(*) as 'Anzahl Tabellen' FROM information_schema.tables WHERE table_schema = DATABASE();

-- Zeige Tabellenstruktur
SHOW TABLES;