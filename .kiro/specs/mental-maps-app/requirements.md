# Anforderungsdokument - Mental Maps Anwendung

## Einführung

Diese Anwendung ermöglicht es Forschern, sprachwissenschaftliche Studien durchzuführen, bei denen Probanden ihre mentalen Karten zu sprachlichen Wahrnehmungen digital erstellen können. Die Anwendung soll eine intuitive, papierähnliche Zeichenerfahrung auf einer interaktiven, skalierbaren Karte bieten und dabei wissenschaftliche Datensammlung und -analyse unterstützen.

## Anforderungen

### Anforderung 1

**User Story:** Als Forscher möchte ich Fragen für sprachwissenschaftliche Studien erstellen und verwalten können, damit ich strukturierte Mental Map-Studien durchführen kann.

#### Akzeptanzkriterien

1. WENN ein Forscher eine neue Studie erstellt, DANN soll das System die Eingabe von Studienfragen ermöglichen
2. WENN eine Frage gespeichert wird, DANN soll das System die Frage mit Metadaten (Typ, Kategorie, Sprache) verknüpfen
3. WENN ein Forscher Fragen bearbeitet, DANN soll das System Änderungen versioniert speichern
4. WENN eine Studie aktiviert wird, DANN soll das System die Fragen in der definierten Reihenfolge präsentieren

### Anforderung 2

**User Story:** Als Proband möchte ich auf einer interaktiven Karte zeichnen können, damit ich meine sprachlichen Wahrnehmungen präzise visualisieren kann.

#### Akzeptanzkriterien

1. WENN ein Proband eine Frage sieht, DANN soll das System eine OSM-basierte, skalierbare Karte anzeigen
2. WENN ein Proband auf der Karte zeichnet, DANN soll das System verschiedene Zeichenwerkzeuge bereitstellen (Stift, Marker, Flächen, Linien)
3. WENN ein Proband zeichnet, DANN soll das System die Zeichnung in Echtzeit ohne Verzögerung darstellen
4. WENN ein Proband die Karte zoomt oder verschiebt, DANN soll das System die Zeichnungen korrekt skaliert und positioniert beibehalten
5. WENN ein Proband einen Fehler macht, DANN soll das System Rückgängig/Wiederholen-Funktionen bereitstellen

### Anforderung 3

**User Story:** Als Proband möchte ich verschiedene Zeichenwerkzeuge verwenden können, damit ich meine Mental Map so detailliert wie mit Stift und Papier erstellen kann.

#### Akzeptanzkriterien

1. WENN ein Proband zeichnet, DANN soll das System mindestens folgende Werkzeuge bereitstellen: Freihandzeichnung, Linien, Kreise, Polygone, Text-Annotationen
2. WENN ein Proband ein Werkzeug auswählt, DANN soll das System verschiedene Farben und Strichstärken ermöglichen
3. WENN ein Proband Text hinzufügt, DANN soll das System verschiedene Schriftgrößen und -farben unterstützen
4. WENN ein Proband Bereiche markiert, DANN soll das System transparente Füllungen mit einstellbarer Deckkraft ermöglichen
5. WENN ein Proband Elemente bearbeitet, DANN soll das System das Auswählen, Verschieben und Löschen einzelner Zeichnungselemente ermöglichen

### Anforderung 4

**User Story:** Als Forscher möchte ich die Mental Maps der Probanden sammeln und analysieren können, damit ich wissenschaftliche Erkenntnisse gewinnen kann.

#### Akzeptanzkriterien

1. WENN ein Proband seine Zeichnung abschließt, DANN soll das System die Mental Map mit Geodaten und Metadaten speichern
2. WENN eine Studie läuft, DANN soll das System alle Antworten anonymisiert und DSGVO-konform sammeln
3. WENN ein Forscher Daten exportiert, DANN soll das System verschiedene Formate unterstützen (JSON, GeoJSON, CSV, Bildexport)
4. WENN ein Forscher Daten analysiert, DANN soll das System grundlegende Visualisierungen und Statistiken bereitstellen
5. WENN mehrere Probanden dieselbe Frage beantwortet haben, DANN soll das System Überlagerungsansichten zur Musteranalyse ermöglichen

### Anforderung 5

**User Story:** Als Proband möchte ich eine intuitive und responsive Benutzeroberfläche haben, damit ich mich auf meine Antworten konzentrieren kann.

#### Akzeptanzkriterien

1. WENN ein Proband die Anwendung öffnet, DANN soll das System eine klare, ablenkungsfreie Oberfläche anzeigen
2. WENN ein Proband auf verschiedenen Geräten arbeitet, DANN soll das System auf Desktop, Tablet und Smartphone funktionieren
3. WENN ein Proband zwischen Fragen navigiert, DANN soll das System den Fortschritt anzeigen und Zwischenspeicherung ermöglichen
4. WENN ein Proband Hilfe benötigt, DANN soll das System kontextuelle Hilfetexte und Tutorials bereitstellen
5. WENN ein Proband die Anwendung verlässt, DANN soll das System den aktuellen Stand automatisch speichern

### Anforderung 6

**User Story:** Als Forscher möchte ich verschiedene Kartenregionen und -stile verwenden können, damit ich studienspezifische Anforderungen erfüllen kann.

#### Akzeptanzkriterien

1. WENN ein Forscher eine Studie konfiguriert, DANN soll das System die Auswahl verschiedener geografischer Regionen ermöglichen
2. WENN eine Karte geladen wird, DANN soll das System verschiedene OSM-basierte Kartenstile anbieten (Standard, Satellit, Topografisch)
3. WENN ein Forscher spezielle Anforderungen hat, DANN soll das System benutzerdefinierte Kartenausschnitte und Zoom-Level definieren können
4. WENN eine Studie mehrsprachig ist, DANN soll das System Kartenbeschriftungen in verschiedenen Sprachen unterstützen

### Anforderung 7

**User Story:** Als Forscher möchte ich Audio-Stimuli in meine Studien einbinden können, damit Probanden auf gehörte Sprachproben reagieren und diese geografisch verorten können.

#### Akzeptanzkriterien

1. WENN ein Forscher eine Frage erstellt, DANN soll das System das Hochladen und Verknüpfen von Audiodateien ermöglichen
2. WENN ein Proband eine Frage mit Audio-Stimulus sieht, DANN soll das System einen integrierten Audio-Player mit Standard-Kontrollen bereitstellen
3. WENN ein Proband Audio abspielt, DANN soll das System verschiedene Audioformate unterstützen (MP3, WAV, OGG)
4. WENN ein Proband Audio mehrfach anhören möchte, DANN soll das System unbegrenzte Wiederholungen ermöglichen
5. WENN ein Forscher Audio-Stimuli verwaltet, DANN soll das System Metadaten wie Sprecher, Dialekt, Aufnahmeort speichern
6. WENN ein Proband nach dem Anhören zeichnet, DANN soll das System die Audiowiedergabe mit der geografischen Verortung verknüpfen

### Anforderung 8

**User Story:** Als Forscher möchte ich verschiedene Antworttypen und Bewertungsskalen verwenden können, damit ich differenzierte sprachwissenschaftliche Daten sammeln kann.

#### Akzeptanzkriterien

1. WENN ein Proband eine Region markiert, DANN soll das System zusätzliche Bewertungsskalen ermöglichen (z.B. "Wie stark ist dieser Dialekt hier?")
2. WENN ein Forscher Fragen konfiguriert, DANN soll das System verschiedene Antworttypen unterstützen (Punkte, Linien, Flächen, Heatmaps)
3. WENN ein Proband Bereiche bewertet, DANN soll das System Intensitätsskalen mit Farbkodierung bereitstellen
4. WENN ein Proband Heatmap-Daten eingibt, DANN soll das System Echtzeit-Heatmap-Vorschau während der Eingabe anzeigen
4. WENN ein Proband mehrere Varianten unterscheidet, DANN soll das System Kategorisierung und Labeling ermöglichen
5. WENN ein Forscher vergleichende Studien durchführt, DANN soll das System Referenzkarten und Vergleichsmodi bereitstellen

### Anforderung 9

**User Story:** Als Forscher möchte ich demografische und soziolinguistische Daten der Probanden erfassen können, damit ich Korrelationen in den Mental Maps analysieren kann.

#### Akzeptanzkriterien

1. WENN ein Proband eine Studie beginnt, DANN soll das System optionale demografische Fragen stellen (Alter, Herkunft, Sprachhintergrund)
2. WENN demografische Daten erfasst werden, DANN soll das System diese anonymisiert mit den Mental Maps verknüpfen
3. WENN ein Forscher Daten analysiert, DANN soll das System Filterung nach demografischen Gruppen ermöglichen
4. WENN ein Proband seine Sprachbiografie angibt, DANN soll das System strukturierte Eingabefelder für Mehrsprachigkeit bereitstellen
5. WENN Probanden aus verschiedenen Regionen teilnehmen, DANN soll das System deren Herkunftsorte für Vergleichsanalysen erfassen

### Anforderung 10

**User Story:** Als Forscher möchte ich kollaborative und longitudinale Studien durchführen können, damit ich komplexere Forschungsdesigns umsetzen kann.

#### Akzeptanzkriterien

1. WENN ein Forscher eine Längsschnittstudie plant, DANN soll das System Probanden zu verschiedenen Zeitpunkten einladen können
2. WENN Probanden mehrfach teilnehmen, DANN soll das System deren vorherige Antworten anonymisiert verfolgen
3. WENN mehrere Forscher zusammenarbeiten, DANN soll das System gemeinsame Studienverwaltung und Datenzugriff ermöglichen
4. WENN ein Forscher Gruppenstudien durchführt, DANN soll das System Echtzeit-Kollaboration auf derselben Karte unterstützen
5. WENN Studien repliziert werden, DANN soll das System Studienvorlagen und -export für andere Institutionen bereitstellen

### Anforderung 11

**User Story:** Als Forscher möchte ich erweiterte Analysewerkzeuge nutzen können, damit ich tiefere Einblicke in die sprachwissenschaftlichen Muster gewinnen kann.

#### Akzeptanzkriterien

1. WENN mehrere Mental Maps vorliegen, DANN soll das System automatische Cluster-Analyse und Hotspot-Erkennung durchführen
2. WENN ein Forscher Heatmaps erstellt, DANN soll das System verschiedene Heatmap-Typen unterstützen (Dichte, Intensität, Übereinstimmung)
3. WENN Heatmaps generiert werden, DANN soll das System anpassbare Parameter bieten (Radius, Gewichtung, Farbschema)
4. WENN ein Forscher Muster analysiert, DANN soll das System interaktive Heatmaps mit Zoom- und Filterfunktionen bereitstellen
3. WENN Daten exportiert werden, DANN soll das System Integration mit gängigen Statistiksoftware (R, SPSS) ermöglichen
4. WENN ein Forscher Präsentationen erstellt, DANN soll das System automatische Visualisierungen und Berichte generieren
5. WENN große Datensätze vorliegen, DANN soll das System maschinelles Lernen für Mustererkennnung anbieten

### Anforderung 12

**User Story:** Als Systemadministrator möchte ich die Anwendung sicher und performant betreiben können, damit Forschungsdaten geschützt sind und die Benutzererfahrung optimal ist.

#### Akzeptanzkriterien

1. WENN Probanden Daten eingeben, DANN soll das System alle Daten verschlüsselt übertragen und speichern
2. WENN die Anwendung unter Last steht, DANN soll das System auch bei vielen gleichzeitigen Nutzern responsive bleiben
3. WENN Daten gespeichert werden, DANN soll das System automatische Backups und Datenintegrität gewährleisten
4. WENN Forscher auf Daten zugreifen, DANN soll das System rollenbasierte Zugriffskontrolle durchsetzen
5. WENN die Anwendung aktualisiert wird, DANN soll das System ohne Datenverlust migriert werden können