import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toJpeg, toPng, toSvg } from 'html-to-image';
import { Map as MapIcon, Maximize2, Minimize2, Download } from "lucide-react";

const MentalMapViewer = ({ mentalMaps, participantCode, questionLabels = {} }) => {
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const [selectedQuestion, setSelectedQuestion] = useState('all');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');

    // Colors for different questions
    const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];
    
    // Get unique questions and assign colors
    const uniqueQuestions = Array.from(new Set(mentalMaps.map(m => m.properties.question_id)));
    const questionColorMap = new Map(
        uniqueQuestions.map((qId, idx) => [qId, COLORS[idx % COLORS.length]])
    );

    const filteredMaps = selectedQuestion === 'all' 
        ? mentalMaps 
        : mentalMaps.filter(m => m.properties.question_id === selectedQuestion);

    // Export function
    const exportViewerPngWithBasemap = async () => {
        if (!containerRef.current) return;
        try {
            const dataUrl = await toPng(containerRef.current, {
                cacheBust: true,
                pixelRatio: 2,
            });
            const a = document.createElement('a');
            const questionName = selectedQuestion === 'all' ? 'Alle' : (questionLabels[selectedQuestion] || selectedQuestion);
            const file = `MentalMap_${participantCode}_${questionName.replace(/[^a-zA-Z0-9_-]+/g, '_')}_mit_Karte.png`;
            a.href = dataUrl;
            a.download = file;
            a.click();
        } catch (err) {
            console.error('PNG-Export failed:', err);
        }
    };

    const exportViewerJpgWithBasemap = async () => {
        if (!containerRef.current) return;
        try {
            const dataUrl = await toJpeg(containerRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                quality: 0.9,
                backgroundColor: '#ffffff'
            });
            const a = document.createElement('a');
            const questionName = selectedQuestion === 'all' ? 'Alle' : (questionLabels[selectedQuestion] || selectedQuestion);
            const file = `MentalMap_${participantCode}_${questionName.replace(/[^a-zA-Z0-9_-]+/g, '_')}_mit_Karte.jpg`;
            a.href = dataUrl;
            a.download = file;
            a.click();
        } catch (err) {
            console.error('JPG-Export failed:', err);
        }
    };

    const exportViewerSvgWithBasemap = async () => {
        if (!containerRef.current) return;
        try {
            const dataUrl = await toSvg(containerRef.current, {
                cacheBust: true,
            });
            const a = document.createElement('a');
            const questionName = selectedQuestion === 'all' ? 'Alle' : (questionLabels[selectedQuestion] || selectedQuestion);
            const file = `MentalMap_${participantCode}_${questionName.replace(/[^a-zA-Z0-9_-]+/g, '_')}_mit_Karte.svg`;
            a.href = dataUrl;
            a.download = file;
            a.click();
        } catch (err) {
            console.error('SVG-Export failed:', err);
        }
    };

    // Initialize Map
    useEffect(() => {
        if (!containerRef.current) return;

        if (!mapRef.current) {
            mapRef.current = L.map(containerRef.current).setView([47.5, 2.5], 5);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(mapRef.current);
            
            // Force invalidate size repeatedly
            const timers = [100, 500, 1000].map(t => 
              setTimeout(() => mapRef.current?.invalidateSize(), t)
            );
        }

        // Clear layers
        mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Polygon || layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                mapRef.current.removeLayer(layer);
            }
        });

        // Add polygons and points
        const bounds = L.latLngBounds([]);
        let hasValidBounds = false;

        filteredMaps.forEach((feature) => {
            let geometry = feature.geometry;
            
            // Handle nested geometry
            if (geometry && geometry.type === 'Feature' && geometry.geometry) {
                geometry = geometry.geometry;
            }
            if (geometry && geometry.type === 'Feature' && geometry.geometry) {
                geometry = geometry.geometry;
            }

            if (!geometry) return;

            const questionLabel = questionLabels[feature.properties.question_id] || feature.properties.question_id;
            const popupContent = `
                <div>
                    <strong>${questionLabel}</strong><br/>
                    VOICE Mental Map ID: ${feature.properties.id}<br/>
                    Teilnehmer: ${feature.properties.participant_code || 'Unbekannt'}<br/>
                    Erstellt: ${feature.properties.created_at ? new Date(feature.properties.created_at).toLocaleString('de-DE') : 'Unbekannt'}
                </div>
            `;

            const addPolygonToMap = (rawCoords) => {
                try {
                    if (!Array.isArray(rawCoords)) return;

                    // Ensure coords are numbers and swap [lng, lat] to [lat, lng] for Leaflet
                    const coordinates = rawCoords.map(coord => [
                        parseFloat(coord[1]), 
                        parseFloat(coord[0])
                    ]);
                    
                    // Validate
                    if (coordinates.some(c => isNaN(c[0]) || isNaN(c[1]))) return;

                    const color = questionColorMap.get(feature.properties.question_id) || COLORS[0];
                    
                    const polygon = L.polygon(coordinates, {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.3,
                        weight: 2
                    }).addTo(mapRef.current);

                    polygon.bindPopup(popupContent);

                    coordinates.forEach(coord => {
                        bounds.extend(coord);
                        hasValidBounds = true;
                    });
                } catch (e) {
                    console.error("Error adding polygon:", e);
                }
            };

            const addPointToMap = (rawCoords) => {
                try {
                    if (!Array.isArray(rawCoords)) return;

                    // Ensure coords are numbers and swap [lng, lat] to [lat, lng] for Leaflet
                    const latlng = [
                        parseFloat(rawCoords[1]), 
                        parseFloat(rawCoords[0])
                    ];
                    
                    // Validate
                    if (isNaN(latlng[0]) || isNaN(latlng[1])) return;

                    const color = questionColorMap.get(feature.properties.question_id) || COLORS[0];
                    
                    const marker = L.circleMarker(latlng, {
                        radius: 8,
                        fillColor: color,
                        color: '#000',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).addTo(mapRef.current);

                    marker.bindPopup(popupContent);

                    bounds.extend(latlng);
                    hasValidBounds = true;
                } catch (e) {
                    console.error("Error adding point:", e);
                }
            };

            if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
                addPolygonToMap(geometry.coordinates[0]);
            } else if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
                geometry.coordinates.forEach(poly => {
                    if (Array.isArray(poly)) addPolygonToMap(poly[0]);
                });
            } else if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
                addPointToMap(geometry.coordinates);
            }
        });

        if (hasValidBounds && mapRef.current) {
            try {
                mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            } catch (e) {
                console.error("Error fitting bounds:", e);
            }
        }

    }, [filteredMaps, isFullscreen]); // Re-run when maps or fullscreen changes

    // Invalidate size on fullscreen toggle
    useEffect(() => {
        // Immediate invalidation for smooth resizing
        if (mapRef.current) {
            mapRef.current.invalidateSize({
                animate: false,
                pan: false
            });
        }
    }, [isFullscreen]);

    if (mentalMaps.length === 0) {
        return (
            <div className="viewer-card">
                <div className="d-flex align-center gap-3 mb-3">
                    <MapIcon size={20} color="#3b82f6" />
                    <h3 className="m-0 fw-bold">VOICE Mental Maps</h3>
                </div>
                <p className="text-gray-500">Keine VOICE Mental Maps verfügbar.</p>
            </div>
        );
    }

    return (
      <div className={isFullscreen ? "viewer-fullscreen" : "viewer-card"}>
        <div className="d-flex align-center justify-between mb-3 flex-wrap gap-3">
            <div className="d-flex align-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <MapIcon size={20} color="#3b82f6" />
                </div>
                <div>
                    <h3 className="m-0 fw-bold">VOICE Mental Maps</h3>
                    <p className="m-0 text-sm text-gray-500">
                        {mentalMaps.length} Karte{mentalMaps.length !== 1 ? 'n' : ''} {participantCode ? `für ${participantCode}` : 'gesamt'}
                    </p>
                </div>
            </div>

            <div className="d-flex align-center gap-2">
                 <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="btn-icon btn-hover"
                    title={isFullscreen ? "Vollbild verlassen" : "Vollbild"}
                >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                
                <div className="d-flex border rounded-md overflow-hidden">
                    <button
                        onClick={exportViewerPngWithBasemap}
                        className="btn-export btn-hover"
                        title="Als PNG exportieren"
                    >
                        <Download size={16} />
                        PNG
                    </button>
                    <button
                        onClick={exportViewerJpgWithBasemap}
                        className="btn-export btn-hover"
                        title="Als JPG exportieren"
                    >
                        JPG
                    </button>
                    <button
                        onClick={exportViewerSvgWithBasemap}
                        className="btn-export btn-hover"
                        title="Als SVG exportieren"
                    >
                        SVG
                    </button>
                </div>

                <select 
                    value={selectedQuestion} 
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                    className="select-input"
                >
                    <option value="all">Alle Fragen ({mentalMaps.length})</option>
                    {uniqueQuestions.map(qId => (
                        <option key={qId} value={qId}>
                            {questionLabels[qId] || qId}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        <div 
            ref={containerRef} 
            className={`map-container relative border rounded-lg overflow-hidden d-block w-100 ${isFullscreen ? 'map-h-fullscreen' : 'map-h-default'}`}
        >
        </div>
        
        {/* Legend */}
        <div className="mt-3 pt-3 border-top">
            <h4 className="text-sm fw-bold mb-3">Legende</h4>
            <div className="d-grid grid-cols-auto-fill gap-2">
                 {Array.from(new Set(filteredMaps.map(f => f.properties.question_id))).map(qId => {
                    const color = questionColorMap.get(qId) || COLORS[0];
                    const questionLabel = questionLabels[qId] || qId;
                    return (
                        <div key={qId} className="d-flex align-center gap-2 text-sm">
                            <div 
                                className="legend-color-box"
                                style={{ 
                                    backgroundColor: color, 
                                    borderColor: color
                                }} 
                            />
                            <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={questionLabel}>{questionLabel}</span>
                        </div>
                    );
                })}
            </div>
        </div>
        
        {debugInfo && (
             <div className="debug-info-box">
                 {debugInfo}
             </div>
        )}
      </div>
    );
};

export default MentalMapViewer;
