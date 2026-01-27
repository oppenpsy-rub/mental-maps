-- Migration: Add answer_data, geolocation and updated_at columns to responses table
-- Dieses Script fügt die fehlenden Spalten zur responses Tabelle hinzu

-- Prüfe ob answer_data Spalte bereits existiert
ALTER TABLE responses 
ADD COLUMN IF NOT EXISTS answer_data LONGTEXT DEFAULT NULL;

-- Prüfe ob geolocation Spalte bereits existiert
ALTER TABLE responses 
ADD COLUMN IF NOT EXISTS geolocation JSON DEFAULT NULL;

-- Prüfe ob updated_at Spalte bereits existiert
ALTER TABLE responses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Zeige die neue Tabellenstruktur
DESCRIBE responses;

-- Bestätigung
SELECT 'Migration erfolgreich durchgeführt!' as Status;
