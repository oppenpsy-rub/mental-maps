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
            [100, 500, 1000].forEach(t => 
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
      <div style={{ display: 'flex', height: '100%', width: '100%', gap: '0px', backgroundColor: '#fff' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapIcon size={20} color="#3b82f6" />
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>Map Viewer</span>
                </div>

                {/* Export Buttons */}
                <div style={{ display: 'flex', gap: '0px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                    <button
                        onClick={exportViewerPngWithBasemap}
                        style={{
                            padding: '6px 10px',
                            color: '#6b7280',
                            backgroundColor: '#fff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                        title="Als PNG exportieren"
                    >
                        <Download size={14} /> PNG
                    </button>
                    <button
                        onClick={exportViewerJpgWithBasemap}
                        style={{
                            padding: '6px 10px',
                            color: '#6b7280',
                            backgroundColor: '#fff',
                            border: 'none',
                            borderLeft: '1px solid #e5e7eb',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                        title="Als JPG exportieren"
                    >
                        JPG
                    </button>
                    <button
                        onClick={exportViewerSvgWithBasemap}
                        style={{
                            padding: '6px 10px',
                            color: '#6b7280',
                            backgroundColor: '#fff',
                            border: 'none',
                            borderLeft: '1px solid #e5e7eb',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                        title="Als SVG exportieren"
                    >
                        SVG
                    </button>
                </div>

                <select 
                    value={selectedQuestion} 
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                    style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">Alle Fragen ({mentalMaps.length})</option>
                    {uniqueQuestions.map(qId => (
                        <option key={qId} value={qId}>
                            {questionLabels[qId] || qId}
                        </option>
                    ))}
                </select>

                {/* Fullscreen Button */}
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    style={{
                        padding: '6px 12px',
                        color: '#6b7280',
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                        marginLeft: 'auto'
                    }}
                >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            <div 
                ref={containerRef} 
                style={{
                    flex: 1,
                    position: 'relative',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0px',
                    overflow: 'hidden',
                    minHeight: 0
                }}
            >
            </div>
        </div>

        {/* Legend Sidebar */}
        <div style={{
            width: '280px',
            borderLeft: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            overflow: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h4 style={{ 
                fontSize: '14px', 
                fontWeight: '700', 
                marginBottom: '12px', 
                color: '#1f2937',
                margin: '0 0 16px 0'
            }}>Fragen & Farben</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {Array.from(new Set(filteredMaps.map(f => f.properties.question_id))).map(qId => {
                    const color = questionColorMap.get(qId) || COLORS[0];
                    const questionLabel = questionLabels[qId] || qId;
                    return (
                        <div key={qId} style={{
                            display: 'flex',
                            gap: '10px',
                            padding: '10px',
                            backgroundColor: '#fff',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div 
                                style={{ 
                                    backgroundColor: color,
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    flexShrink: 0
                                }} 
                            />
                            <span style={{
                                fontSize: '13px',
                                color: '#374151',
                                lineHeight: '1.5',
                                wordBreak: 'break-word'
                            }}>{questionLabel}</span>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    );
};

export default MentalMapViewer;
