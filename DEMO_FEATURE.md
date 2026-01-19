# Demo Study Feature

## Übersicht
Die Startseite der Mental Map Anwendung zeigt jetzt eine Demo-Studie anstelle einer echten Studie aus der Datenbank. Dies ermöglicht es Interessenten, das System auszuprobieren, ohne echte Forschungsdaten zu beeinflussen.

## Implementierung

### Geänderte Dateien
- `client/src/App.js`: Hauptimplementierung der Demo-Funktionalität

### Demo-Studie Struktur
Die Demo-Studie (`DEMO_STUDY`) enthält:
- **ID**: "demo-study"
- **Name**: "Demo: Mental Map Tool"
- **Beschreibung**: Erklärt, dass es sich um eine Demo handelt
- **Beispielfragen**: 3 Fragen zu verschiedenen Themen (Lieblingsorte, Arbeitsplatz, Freizeitaktivitäten)

### Funktionsweise
1. Beim Laden der Startseite wird automatisch die Demo-Studie geladen
2. Ein Demo-Teilnehmercode wird generiert (Format: "DEMO-XXXX")
3. Die Anwendung funktioniert im Preview-Modus:
   - Keine echten Daten werden gespeichert
   - Nach Abschluss wird eine Bestätigungsmodal angezeigt
   - Benutzer können die Demo beliebig oft wiederholen

### Technische Details
- Die Demo-Studie wird direkt im Code definiert (kein Datenbankzugriff)
- Der ursprüngliche `loadStudy` API-Aufruf wurde für die Startseite deaktiviert
- Preview-Modus verhindert das Speichern von Antworten

## Vorteile
- Interessenten können das System sofort testen
- Keine Auswirkungen auf echte Forschungsdaten
- Einfache Wartung durch Code-basierte Definition
- Funktioniert auch ohne Backend-Verbindung

## Wartung
Um die Demo-Studie zu ändern:
1. Bearbeite das `DEMO_STUDY` Objekt in `client/src/App.js`
2. Passe Fragen, Beschreibung oder andere Eigenschaften nach Bedarf an
3. Teste die Änderungen lokal vor dem Deployment

## Deployment
Die Demo-Funktionalität ist vollständig client-seitig und erfordert keine Backend-Änderungen. Sie funktioniert sowohl in der Entwicklungsumgebung als auch in der Produktion auf Render.