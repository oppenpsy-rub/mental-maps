# 🤝 Beitragen zum MentalMap-Tool

Vielen Dank für Ihr Interesse am MentalMap-Tool! Wir freuen uns über Beiträge zur Verbesserung dieses Forschungstools.

## 🚀 Erste Schritte

### Voraussetzungen
- Node.js 18+ 
- npm oder yarn
- Git
- Grundkenntnisse in React.js und Node.js

### Entwicklungsumgebung einrichten

1. **Repository forken und klonen**
   ```bash
   git clone https://github.com/IHR-USERNAME/mental-maps.git
   cd mental-maps
   ```

2. **Dependencies installieren**
   ```bash
   # Root-Abhängigkeiten
   npm install
   
   # Client-Abhängigkeiten
   cd client && npm install
   
   # Server-Abhängigkeiten
   cd ../server && npm install
   ```

3. **Umgebung konfigurieren**
   ```bash
   # Kopieren Sie die Beispiel-Konfiguration
   cp .env.example .env
   cp server/.env.example server/.env
   ```

4. **Entwicklungsserver starten**
   ```bash
   # Im Root-Verzeichnis
   npm run dev
   ```

## 📋 Entwicklungsrichtlinien

### Code-Stil
- **JavaScript**: ES6+ Features verwenden
- **React**: Funktionale Komponenten mit Hooks bevorzugen
- **Kommentare**: Auf Deutsch für Forschungskontext, auf Englisch für technische Details
- **Variablen**: Aussagekräftige Namen verwenden

### Commit-Nachrichten
Verwenden Sie das folgende Format:
```
typ(bereich): kurze Beschreibung

Längere Beschreibung falls nötig

- Aufzählungspunkte für Details
- Weitere Änderungen
```

**Typen:**
- `feat`: Neue Funktionalität
- `fix`: Fehlerbehebung
- `docs`: Dokumentation
- `style`: Code-Formatierung
- `refactor`: Code-Umstrukturierung
- `test`: Tests hinzufügen/ändern
- `chore`: Build-Prozess, Abhängigkeiten

**Beispiele:**
```
feat(map): Polygon-Zeichnung mit Leaflet implementiert
fix(auth): JWT-Token Validierung korrigiert
docs(readme): Installation-Anweisungen aktualisiert
```

## 🔄 Workflow

### Feature-Entwicklung
1. **Branch erstellen**
   ```bash
   git checkout -b feature/neue-funktionalität
   ```

2. **Entwickeln und testen**
   - Änderungen implementieren
   - Tests schreiben/aktualisieren
   - Lokal testen

3. **Commit und Push**
   ```bash
   git add .
   git commit -m "feat(bereich): neue Funktionalität hinzugefügt"
   git push origin feature/neue-funktionalität
   ```

4. **Pull Request erstellen**
   - Beschreibung der Änderungen
   - Screenshots bei UI-Änderungen
   - Tests dokumentieren

### Bug-Fixes
1. **Issue erstellen** (falls nicht vorhanden)
2. **Branch erstellen**: `fix/issue-nummer-beschreibung`
3. **Fix implementieren und testen**
4. **Pull Request mit Referenz zum Issue**

## 🧪 Tests

### Lokale Tests ausführen
```bash
# Client-Tests
cd client && npm test

# Server-Tests
cd server && npm test

# Integration-Tests
npm run test:integration
```

### Test-Richtlinien
- **Unit-Tests**: Für einzelne Funktionen/Komponenten
- **Integration-Tests**: Für API-Endpunkte
- **E2E-Tests**: Für kritische User-Flows
- **Mindestens 80% Code-Coverage** anstreben

## 📚 Forschungskontext

### Linguistische Aspekte
- **Perzeptionsstudien**: Verstehen Sie die wissenschaftlichen Ziele
- **Datenqualität**: Präzision bei geografischen Daten ist kritisch
- **Benutzerfreundlichkeit**: Teilnehmer sollen sich auf die Forschung konzentrieren können

### Technische Überlegungen
- **Performance**: Große Kartendaten effizient handhaben
- **Accessibility**: WCAG 2.1 AA Standards einhalten
- **Internationalisierung**: Deutsch/Englisch unterstützen
- **DSGVO-Konformität**: Datenschutz bei Forschungsdaten

## 🐛 Bug-Reports

### Informationen bereitstellen
- **Browser und Version**
- **Betriebssystem**
- **Schritte zur Reproduktion**
- **Erwartetes vs. tatsächliches Verhalten**
- **Screenshots/Videos** (falls hilfreich)
- **Konsolen-Logs** (bei JavaScript-Fehlern)

### Template verwenden
```markdown
**Bug-Beschreibung:**
Kurze Beschreibung des Problems

**Reproduktion:**
1. Gehen Sie zu '...'
2. Klicken Sie auf '...'
3. Scrollen Sie nach unten zu '...'
4. Fehler tritt auf

**Erwartetes Verhalten:**
Was sollte passieren

**Screenshots:**
Falls zutreffend, Screenshots hinzufügen

**Umgebung:**
- Browser: [z.B. Chrome 91.0]
- OS: [z.B. Windows 10]
- Version: [z.B. v1.2.0]
```

## 🎯 Feature-Requests

### Vor dem Request
- **Bestehende Issues prüfen**
- **Forschungsrelevanz bewerten**
- **Technische Machbarkeit berücksichtigen**

### Request-Format
```markdown
**Feature-Beschreibung:**
Klare Beschreibung der gewünschten Funktionalität

**Forschungsnutzen:**
Wie hilft dies bei linguistischen Studien?

**Benutzer-Story:**
Als [Rolle] möchte ich [Funktionalität] damit [Nutzen]

**Akzeptanzkriterien:**
- [ ] Kriterium 1
- [ ] Kriterium 2
- [ ] Kriterium 3

**Zusätzlicher Kontext:**
Screenshots, Mockups, ähnliche Tools
```

## 📖 Dokumentation

### Code-Dokumentation
- **JSDoc** für Funktionen verwenden
- **README-Dateien** für Module aktualisieren
- **API-Dokumentation** bei Backend-Änderungen

### Forschungs-Dokumentation
- **Methodische Überlegungen** dokumentieren
- **Datenstrukturen** erklären
- **Konfigurationsoptionen** beschreiben

## 🏛️ Institutionelle Richtlinien

### Ruhr-Universität Bochum
- **Ethik-Richtlinien** für Forschungssoftware beachten
- **Datenschutz-Standards** einhalten
- **Open-Source-Lizenzierung** respektieren

### Qualitätssicherung
- **Code-Review** durch mindestens eine Person
- **Wissenschaftliche Validierung** bei methodischen Änderungen
- **Performance-Tests** bei größeren Änderungen

## 🙋‍♀️ Hilfe erhalten

### Kommunikationskanäle
- **GitHub Issues**: Für Bugs und Feature-Requests
- **GitHub Discussions**: Für allgemeine Fragen
- **E-Mail**: Für vertrauliche/institutionelle Anfragen

### Mentoring
- **Neue Mitwirkende**: Gerne bei ersten Beiträgen unterstützen
- **Forschungskontext**: Erklärung der linguistischen Hintergründe
- **Technische Fragen**: Architektur und Design-Entscheidungen

---

**Vielen Dank für Ihren Beitrag zur linguistischen Forschung! 🎓**