import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toPng, toJpeg, toSvg } from 'html-to-image';
import { Flame, Maximize2, Minimize2, Download, Settings, Layers, GripHorizontal } from "lucide-react";

// Helper for labels
// (Labels are passed via props now)

// Ray casting algorithm to check if point is in polygon
const isPointInPolygon = (point, polygon) => {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const getHeatColor = (intensity) => {
    // Blue -> Cyan -> Green -> Yellow -> Red (Extended Heatmap)
    const val = Math.max(0, Math.min(1, intensity));
    
    let r, g, b;
    
    if (val < 0.25) {
        // Blue (0,0,255) -> Cyan (0,255,255)
        const t = val / 0.25;
        r = 0;
        g = Math.round(255 * t);
        b = 255;
    } else if (val < 0.5) {
        // Cyan (0,255,255) -> Green (0,255,0)
        const t = (val - 0.25) / 0.25;
        r = 0;
        g = 255;
        b = Math.round(255 * (1 - t));
    } else if (val < 0.75) {
        // Green (0,255,0) -> Yellow (255,255,0)
        const t = (val - 0.5) / 0.25;
        r = Math.round(255 * t);
        g = 255;
        b = 0;
    } else {
        // Yellow (255,255,0) -> Red (255,0,0)
        const t = (val - 0.75) / 0.25;
        r = 255;
        g = Math.round(255 * (1 - t));
        b = 0;
    }
    
    // Alpha adjustment: lower intensity = more transparent
    return `rgba(${r}, ${g}, ${b}, ${Math.min(0.85, 0.4 + val * 0.6)})`;
};

const MentalMapHeatmap = ({ mentalMapData, participantCodes, questionLabels = {} }) => {
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const heatCanvasRef = useRef(null);
    const heatmapDataRef = useRef(null);
    const hoverTimeoutRef = useRef(null);
    const addressCacheRef = useRef(new Map());
    const lastFetchTimeRef = useRef(0);
    const [gridSize, setGridSize] = useState(0.05);
    const [minOverlap, setMinOverlap] = useState(0);
    const [smoothing, setSmoothing] = useState(true);
    const [visualBlur, setVisualBlur] = useState(true);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [tempSelectedQuestions, setTempSelectedQuestions] = useState([]);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isConfiguring, setIsConfiguring] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isComputing, setIsComputing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');

    const LABELS = questionLabels;

    const CANVAS_THRESHOLD = 0.051; // Use Canvas below this size (including 0.05)

    // Filter features
    const filteredFeatures = useMemo(() => {
        if (!hasGenerated) return [];
        let features = mentalMapData.features || [];
        if (selectedQuestions.length > 0) {
            features = features.filter(f => selectedQuestions.includes(f.properties.question_id));
        }
        return features;
    }, [mentalMapData, selectedQuestions, hasGenerated]);

    // Unique questions for dropdown
    const uniqueQuestions = useMemo(() => {
        const features = mentalMapData.features || [];
        return Array.from(new Set(features.map(f => f.properties.question_id))).sort();
    }, [mentalMapData]);

    // Initialize temp selection
    useEffect(() => {
        setTempSelectedQuestions(uniqueQuestions);
    }, [uniqueQuestions]);

    const handleGenerate = () => {
        setSelectedQuestions(tempSelectedQuestions);
        setHasGenerated(true);
        setIsConfiguring(false);
    };

    const toggleQuestion = (qId) => {
        setTempSelectedQuestions(prev => 
            prev.includes(qId) 
                ? prev.filter(id => id !== qId)
                : [...prev, qId]
        );
    };

    const handleSelectAll = () => {
        if (tempSelectedQuestions.length === uniqueQuestions.length) {
            setTempSelectedQuestions([]);
        } else {
            setTempSelectedQuestions(uniqueQuestions);
        }
    };

    // Export function
    const exportHeatmapPng = async () => {
        if (!containerRef.current) return;
        try {
            const dataUrl = await toPng(containerRef.current, { cacheBust: true, pixelRatio: 2 });
            const a = document.createElement('a');
            const qLabel = selectedQuestions.length === uniqueQuestions.length ? 'Alle' : `${selectedQuestions.length}_Fragen`;
            a.href = dataUrl;
            a.download = `Heatmap_${qLabel}_grid${gridSize}.png`;
            a.click();
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const exportHeatmapJpg = async () => {
        if (!containerRef.current) return;
        try {
            const dataUrl = await toJpeg(containerRef.current, { 
                cacheBust: true, 
                pixelRatio: 2,
                quality: 0.9,
                backgroundColor: '#ffffff'
            });
            const a = document.createElement('a');
            const qLabel = selectedQuestions.length === uniqueQuestions.length ? 'Alle' : `${selectedQuestions.length}_Fragen`;
            a.href = dataUrl;
            a.download = `Heatmap_${qLabel}_grid${gridSize}.jpg`;
            a.click();
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const exportHeatmapSvg = async () => {
        if (!containerRef.current) return;
        try {
            const dataUrl = await toSvg(containerRef.current, { 
                cacheBust: true, 
            });
            const a = document.createElement('a');
            const qLabel = selectedQuestions.length === uniqueQuestions.length ? 'Alle' : `${selectedQuestions.length}_Fragen`;
            a.href = dataUrl;
            a.download = `Heatmap_${qLabel}_grid${gridSize}.svg`;
            a.click();
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    // Main Heatmap Logic
    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Map
        if (!mapRef.current) {
            mapRef.current = L.map(containerRef.current, { 
                preferCanvas: true, 
                renderer: L.canvas() 
            }).setView([47.5, 2.5], 5);
            
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(mapRef.current);

            // Add Legend
            const legend = L.control({ position: 'bottomright' });
            legend.onAdd = function () {
                const div = L.DomUtil.create('div', 'info legend heatmap-legend');
                
                div.innerHTML = `
                    <div class="legend-title">Überlappung</div>
                    <div class="legend-scale">
                        <span class="legend-label">Wenig</span>
                        <div class="legend-gradient-bar"></div>
                        <span class="legend-label">Viel</span>
                    </div>
                `;
                return div;
            };
            legend.addTo(mapRef.current);

            // Invalidate size loop
            [100, 500, 1000, 2000].forEach(t => 
                setTimeout(() => mapRef.current?.invalidateSize(), t)
            );
        }

        const map = mapRef.current;
        let cleanup = () => {};
        let cancelled = false;
        
        // Clear existing layers
        map.eachLayer(layer => {
            if (layer instanceof L.Rectangle || layer instanceof L.ImageOverlay || layer instanceof L.LayerGroup) {
                map.removeLayer(layer);
            }
        });
        
        // Remove old canvas if exists
        const overlayPane = map.getPane('overlayPane');
        // Clean all heatmap canvases
        const oldCanvases = overlayPane.querySelectorAll('.heatmap-canvas');
        oldCanvases.forEach(c => overlayPane.removeChild(c));
        heatCanvasRef.current = null;
        heatmapDataRef.current = null;

        if (filteredFeatures.length === 0) return;

        // Async calculation to avoid freezing UI
        const calculateHeatmap = async () => {
            try {
                if (cancelled) return;
                setIsComputing(true);
                setStatusMessage('Analysiere Geometrien...');
                setProgress(10);
                await new Promise(r => setTimeout(r, 0));
                if (cancelled) return;

                // 1. Determine Bounds
                let minLat = Infinity, maxLat = -Infinity;
                let minLng = Infinity, maxLng = -Infinity;

                // Pre-process polygons and points
                const polygons = [];
                const points = [];

                filteredFeatures.forEach((feature, featureIdx) => {
                    let geometry = feature.geometry;
                    // Handle nested geometry (robust)
                    if (geometry && geometry.type === 'Feature' && geometry.geometry) geometry = geometry.geometry;
                    if (geometry && geometry.type === 'Feature' && geometry.geometry) geometry = geometry.geometry;

                    if (!geometry) return;

                    const extractCoords = (coords) => {
                         // GeoJSON is [lng, lat]
                        const c = coords.map(pt => [parseFloat(pt[0]), parseFloat(pt[1])]);
                        if (c.some(pt => isNaN(pt[0]) || isNaN(pt[1]))) return null;
                        return c;
                    };

                    if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
                        const rawCoords = geometry.coordinates[0];
                        if (Array.isArray(rawCoords)) {
                            const coords = extractCoords(rawCoords);
                            if (coords) {
                                polygons.push({ coords, featureIdx });
                                coords.forEach(([lng, lat]) => {
                                    minLat = Math.min(minLat, lat);
                                    maxLat = Math.max(maxLat, lat);
                                    minLng = Math.min(minLng, lng);
                                    maxLng = Math.max(maxLng, lng);
                                });
                            }
                        }
                    } else if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
                         geometry.coordinates.forEach(polyCoords => {
                             const rawCoords = polyCoords[0];
                             if (Array.isArray(rawCoords)) {
                                const coords = extractCoords(rawCoords);
                                if (coords) {
                                    polygons.push({ coords, featureIdx });
                                    coords.forEach(([lng, lat]) => {
                                        minLat = Math.min(minLat, lat);
                                        maxLat = Math.max(maxLat, lat);
                                        minLng = Math.min(minLng, lng);
                                        maxLng = Math.max(maxLng, lng);
                                    });
                                }
                             }
                         });
                    } else if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
                        const rawCoords = [geometry.coordinates]; // Wrap in array for extractCoords
                        const coords = extractCoords(rawCoords);
                        if (coords && coords.length > 0) {
                            const pt = coords[0];
                            points.push({ pt, featureIdx });
                            minLat = Math.min(minLat, pt[1]);
                            maxLat = Math.max(maxLat, pt[1]);
                            minLng = Math.min(minLng, pt[0]);
                            maxLng = Math.max(maxLng, pt[0]);
                        }
                    }
                });

                if (polygons.length === 0 && points.length === 0) {
                    return;
                }

                // Safety clamp
                if (maxLat - minLat > 15 || maxLng - minLng > 15) {
                    console.warn("Area too large for heatmap");
                    // Optional: Clamp or abort
                }

                setStatusMessage('Berechne Raster...');
                setProgress(30);
                await new Promise(r => setTimeout(r, 0));
                if (cancelled) return;

                // 2. Create Grid
                const minLatKey = Math.floor(minLat / gridSize);
                const maxLatKey = Math.ceil(maxLat / gridSize);
                const minLngKey = Math.floor(minLng / gridSize);
                const maxLngKey = Math.ceil(maxLng / gridSize);
                
                const height = maxLatKey - minLatKey + 1;
                const width = maxLngKey - minLngKey + 1;
                
                const grid = new Float32Array(width * height);
                const ownerGrid = new Int32Array(width * height).fill(-1);

                // 3. Fill Grid
                let processed = 0;
                const total = polygons.length;
                
                for (const { coords, featureIdx } of polygons) {
                    if (cancelled) return;
                    // Optimization: Bounding box for this polygon
                    let pMinLat = Infinity, pMaxLat = -Infinity;
                    let pMinLng = Infinity, pMaxLng = -Infinity;
                    coords.forEach(([lng, lat]) => {
                        pMinLat = Math.min(pMinLat, lat);
                        pMaxLat = Math.max(pMaxLat, lat);
                        pMinLng = Math.min(pMinLng, lng);
                        pMaxLng = Math.max(pMaxLng, lng);
                    });

                    const startLatKey = Math.max(minLatKey, Math.floor(pMinLat / gridSize));
                    const endLatKey = Math.min(maxLatKey, Math.ceil(pMaxLat / gridSize));
                    const startLngKey = Math.max(minLngKey, Math.floor(pMinLng / gridSize));
                    const endLngKey = Math.min(maxLngKey, Math.ceil(pMaxLng / gridSize));

                    for (let latKey = startLatKey; latKey <= endLatKey; latKey++) {
                        const lat = latKey * gridSize;
                        for (let lngKey = startLngKey; lngKey <= endLngKey; lngKey++) {
                            const lng = lngKey * gridSize;
                            if (isPointInPolygon([lng, lat], coords)) {
                                const idx = (latKey - minLatKey) * width + (lngKey - minLngKey);
                                if (grid[idx] === 0) {
                                    ownerGrid[idx] = featureIdx;
                                } else {
                                    ownerGrid[idx] = -2; // Multiple
                                }
                                grid[idx]++;
                            }
                        }
                    }
                    processed++;
                    if (processed % 50 === 0) {
                         setProgress(30 + Math.round((processed / total) * 40));
                         await new Promise(r => setTimeout(r, 0));
                    }
                }

                // Process points
                points.forEach(({ pt, featureIdx }) => {
                    const [lng, lat] = pt;
                    const latKey = Math.round(lat / gridSize);
                    const lngKey = Math.round(lng / gridSize);
                    
                    const gridY = latKey - minLatKey;
                    const gridX = lngKey - minLngKey;
                    
                    if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
                        const idx = gridY * width + gridX;
                        
                        if (grid[idx] === 0) {
                            ownerGrid[idx] = featureIdx;
                        } else if (ownerGrid[idx] !== featureIdx) {
                            ownerGrid[idx] = -2;
                        }
                        grid[idx]++;
                    }
                });

                setStatusMessage('Glätte Daten...');
                setProgress(70);
                await new Promise(r => setTimeout(r, 0));
                if (cancelled) return;

                // 4. Smoothing (Optional)
                let finalGrid = grid;
                if (smoothing) {
                    const smoothed = new Float32Array(width * height);
                    const kernel = 1; // 3x3
                    for (let r = 0; r < height; r++) {
                        for (let c = 0; c < width; c++) {
                            let sum = 0, count = 0;
                            for (let dr = -kernel; dr <= kernel; dr++) {
                                for (let dc = -kernel; dc <= kernel; dc++) {
                                    const nr = r + dr;
                                    const nc = c + dc;
                                    if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
                                        sum += grid[nr * width + nc];
                                        count++;
                                    }
                                }
                            }
                            smoothed[r * width + c] = count ? sum / count : 0;
                        }
                    }
                    finalGrid = smoothed;
                }

                // 5. Render
                setStatusMessage('Rendere Karte...');
                setProgress(90);
                await new Promise(r => setTimeout(r, 0));
                if (cancelled) return;

                let maxCount = 0;
                for (let i = 0; i < finalGrid.length; i++) {
                    if (finalGrid[i] > maxCount) maxCount = finalGrid[i];
                }

                // Store data for interactivity
                heatmapDataRef.current = {
                    grid: finalGrid,
                    rawGrid: grid,
                    ownerGrid,
                    width,
                    height,
                    minLatKey,
                    minLngKey,
                    gridSize,
                    maxCount
                };

                // Shared Tooltip and Interaction Logic
                const tooltip = L.tooltip({
                    direction: 'top',
                    sticky: true,
                    className: 'heatmap-tooltip',
                    opacity: 0.9,
                    offset: [0, -10]
                });

                const handleMouseMove = (e) => {
                    if (!heatmapDataRef.current) return;
                    const { grid, rawGrid, ownerGrid, width, height, minLatKey, minLngKey, gridSize } = heatmapDataRef.current;
                    const { lat, lng } = e.latlng;
                    
                    // Clear any pending fetch
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                    }

                    // Calculate grid index
                    const latKey = Math.floor(lat / gridSize);
                    const lngKey = Math.floor(lng / gridSize);
                    
                    const r = latKey - minLatKey;
                    const c = lngKey - minLngKey;
                    
                    // Check if inside grid bounds
                    if (r >= 0 && r < height && c >= 0 && c < width) {
                            const idx = r * width + c;
                            const val = grid[idx];
                            
                            if (val > 0 && val >= minOverlap) {
                                const rawVal = rawGrid[idx];
                                let participantInfo = '';
                                
                                // Determine participant ID
                                let featureIdx = -1;
                                
                                if (ownerGrid[idx] >= 0) {
                                    featureIdx = ownerGrid[idx];
                                } else if (val <= 1.05) {
                                    // Halo search: check neighbors if this is a low-intensity area
                                    // (Likely a smoothed edge of a single participant)
                                    const candidates = new Set();
                                    for (let dr = -1; dr <= 1; dr++) {
                                        for (let dc = -1; dc <= 1; dc++) {
                                            const nr = r + dr;
                                            const nc = c + dc;
                                            if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
                                                const nIdx = nr * width + nc;
                                                if (ownerGrid[nIdx] >= 0) {
                                                    candidates.add(ownerGrid[nIdx]);
                                                }
                                            }
                                        }
                                    }
                                    if (candidates.size === 1) {
                                        featureIdx = candidates.values().next().value;
                                    }
                                }

                                if (featureIdx >= 0) {
                                    const feature = filteredFeatures[featureIdx];
                                    if (feature && feature.properties) {
                                        // Try to get participant code from properties (GeoJSON export has participant_code)
                                        const pCode = feature.properties.participant_code || 
                                                    (participantCodes && participantCodes[feature.properties.participant_id]) || 
                                                    feature.properties.participant_id || 
                                                    'Unbekannt';
                                        
                                        participantInfo = `<div class="popup-participant">Proband: ${pCode}</div>`;
                                    }
                                }

                                const content = `
                                    <div class="popup-container">
                                        <div class="popup-title">Überlappungen: ${smoothing ? val.toFixed(2) : Math.round(val)}</div>
                                        ${participantInfo}
                                        <div class="popup-content">
                                            <div class="popup-row">Lat: ${lat.toFixed(5)} · Lng: ${lng.toFixed(5)}</div>
                                            <div class="popup-footer-italic">
                                                Lade Ort...
                                            </div>
                                        </div>
                                    </div>
                                `;
                                
                                tooltip.setLatLng(e.latlng).setContent(content);
                                if (!map.hasLayer(tooltip)) {
                                    tooltip.addTo(map);
                                }

                                // Debounce address fetch
                                hoverTimeoutRef.current = setTimeout(async () => {
                                    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
                                    
                                    const updateTooltip = (addrData) => {
                                        let labelRegion = 'Region';
                                        let labelDept = 'Gebiet'; // Default generic
                                        let labelCommune = 'Gemeinde';
                                        
                                        const cc = addrData.country_code ? addrData.country_code.toLowerCase() : '';

                                        // Country-specific labels configuration
                                            const labels = {
                                                // --- EUROPE ---
                                                de: { region: 'Bundesland', dept: 'Landkreis' },
                                                at: { region: 'Bundesland', dept: 'Bezirk' },
                                                ch: { region: 'Kanton', dept: 'Bezirk' },
                                                fr: { region: 'Region', dept: 'Département' },
                                                be: { region: 'Region', dept: 'Provinz' },
                                                nl: { region: 'Provinz', dept: 'Gemeinde' },
                                                lu: { region: 'Kanton', dept: 'Gemeinde' },
                                                ie: { region: 'Provinz', dept: 'County' },
                                                gb: { region: 'Region', dept: 'Grafschaft' },
                                                uk: { region: 'Region', dept: 'Grafschaft' },
                                                it: { region: 'Region', dept: 'Provinz' },
                                                es: { region: 'Region', dept: 'Provinz' },
                                                pt: { region: 'Distrikt', dept: 'Kreis' },
                                                gr: { region: 'Region', dept: 'Regionalbezirk' },
                                                mt: { region: 'Region', dept: 'Distrikt' },
                                                cy: { region: 'Bezirk', dept: 'Gemeinde' },
                                                ad: { region: 'Gemeinde', dept: '' },
                                                sm: { region: 'Gemeinde', dept: '' },
                                                va: { region: '', dept: '' },
                                                mc: { region: 'Quartier', dept: '' },
                                                dk: { region: 'Region', dept: 'Kommune' },
                                                se: { region: 'Provinz', dept: 'Gemeinde' },
                                                no: { region: 'Provinz', dept: 'Gemeinde' },
                                                fi: { region: 'Landschaft', dept: 'Gemeinde' },
                                                is: { region: 'Region', dept: 'Gemeinde' },
                                                pl: { region: 'Woiwodschaft', dept: 'Kreis' },
                                                cz: { region: 'Region', dept: 'Bezirk' },
                                                sk: { region: 'Landschaftsverband', dept: 'Bezirk' },
                                                hu: { region: 'Komitat', dept: 'Kreis' },
                                                ro: { region: 'Kreis', dept: 'Gemeinde' },
                                                bg: { region: 'Oblast', dept: 'Gemeinde' },
                                                hr: { region: 'Gespanschaft', dept: 'Gemeinde' },
                                                si: { region: 'Region', dept: 'Gemeinde' },
                                                ee: { region: 'Landkreis', dept: 'Gemeinde' },
                                                lv: { region: 'Bezirk', dept: 'Gemeinde' },
                                                lt: { region: 'Bezirk', dept: 'Gemeinde' },
                                                ua: { region: 'Oblast', dept: 'Rajon' },
                                                by: { region: 'Woblast', dept: 'Rajon' },
                                                md: { region: 'Rajon', dept: '' },
                                                rs: { region: 'Bezirk', dept: 'Gemeinde' },
                                                ba: { region: 'Kanton', dept: 'Gemeinde' },
                                                mk: { region: 'Region', dept: 'Gemeinde' },
                                                al: { region: 'Qark', dept: 'Gemeinde' },
                                                xk: { region: 'Bezirk', dept: 'Gemeinde' },
                                                me: { region: 'Gemeinde', dept: '' },
                                                ru: { region: 'Oblast', dept: 'Rajon' },
                                                li: { region: 'Oberland/Unterland', dept: 'Gemeinde' },

                                                // --- NORTH AMERICA ---
                                                us: { region: 'Bundesstaat', dept: 'County' },
                                                ca: { region: 'Provinz', dept: 'County' },
                                                mx: { region: 'Bundesstaat', dept: 'Gemeinde' },
                                                gt: { region: 'Departement', dept: 'Gemeinde' },
                                                bz: { region: 'Distrikt', dept: 'Wahlkreis' },
                                                sv: { region: 'Departement', dept: 'Gemeinde' },
                                                hn: { region: 'Departement', dept: 'Gemeinde' },
                                                ni: { region: 'Departement', dept: 'Gemeinde' },
                                                cr: { region: 'Provinz', dept: 'Kanton' },
                                                pa: { region: 'Provinz', dept: 'Distrikt' },
                                                cu: { region: 'Provinz', dept: 'Gemeinde' },
                                                ht: { region: 'Departement', dept: 'Arrondissement' },
                                                do: { region: 'Provinz', dept: 'Gemeinde' },
                                                jm: { region: 'Parish', dept: '' },
                                                tt: { region: 'Region', dept: '' },
                                                bs: { region: 'Distrikt', dept: '' },
                                                bb: { region: 'Parish', dept: '' },

                                                // --- SOUTH AMERICA ---
                                                br: { region: 'Bundesstaat', dept: 'Gemeinde' },
                                                ar: { region: 'Provinz', dept: 'Departement' },
                                                cl: { region: 'Region', dept: 'Provinz' },
                                                co: { region: 'Departement', dept: 'Gemeinde' },
                                                pe: { region: 'Region', dept: 'Provinz' },
                                                ve: { region: 'Bundesstaat', dept: 'Gemeinde' },
                                                ec: { region: 'Provinz', dept: 'Kanton' },
                                                bo: { region: 'Departement', dept: 'Provinz' },
                                                py: { region: 'Departement', dept: 'Distrikt' },
                                                uy: { region: 'Departement', dept: '' },
                                                gy: { region: 'Region', dept: '' },
                                                sr: { region: 'Distrikt', dept: 'Ressort' },

                                                // --- ASIA ---
                                                cn: { region: 'Provinz', dept: 'Präfektur' },
                                                jp: { region: 'Präfektur', dept: 'Bezirk' },
                                                in: { region: 'Bundesstaat', dept: 'Distrikt' },
                                                kr: { region: 'Provinz', dept: 'Stadt/Landkreis' },
                                                id: { region: 'Provinz', dept: 'Regierungsbezirk' },
                                                th: { region: 'Provinz', dept: 'Amphoe' },
                                                vn: { region: 'Provinz', dept: 'Bezirk' },
                                                my: { region: 'Bundesstaat', dept: 'Distrikt' },
                                                ph: { region: 'Provinz', dept: 'Gemeinde' },
                                                pk: { region: 'Provinz', dept: 'Distrikt' },
                                                bd: { region: 'Division', dept: 'Distrikt' },
                                                ir: { region: 'Provinz', dept: 'Schahrestan' },
                                                tr: { region: 'Provinz', dept: 'Distrikt' },
                                                sa: { region: 'Provinz', dept: 'Gouvernement' },
                                                il: { region: 'Bezirk', dept: '' },
                                                ae: { region: 'Emirat', dept: '' },
                                                qa: { region: 'Gemeinde', dept: '' },
                                                kw: { region: 'Gouvernement', dept: '' },
                                                om: { region: 'Gouvernement', dept: 'Wilaya' },
                                                kz: { region: 'Gebiet', dept: 'Bezirk' },
                                                uz: { region: 'Provinz', dept: 'Bezirk' },
                                                tm: { region: 'Provinz', dept: 'Distrikt' },
                                                kg: { region: 'Gebiet', dept: 'Bezirk' },
                                                tj: { region: 'Provinz', dept: 'Distrikt' },
                                                af: { region: 'Provinz', dept: 'Distrikt' },
                                                np: { region: 'Provinz', dept: 'Distrikt' },
                                                lk: { region: 'Provinz', dept: 'Distrikt' },
                                                mm: { region: 'Region', dept: 'Distrikt' },
                                                la: { region: 'Provinz', dept: 'Distrikt' },
                                                kh: { region: 'Provinz', dept: 'Bezirk' },
                                                mn: { region: 'Provinz', dept: 'Sum' },
                                                kp: { region: 'Provinz', dept: 'Kreis' },
                                                sy: { region: 'Gouvernement', dept: 'Distrikt' },
                                                jo: { region: 'Gouvernement', dept: '' },
                                                lb: { region: 'Gouvernement', dept: 'Distrikt' },
                                                ye: { region: 'Gouvernement', dept: 'Distrikt' },
                                                iq: { region: 'Gouvernement', dept: 'Distrikt' },
                                                az: { region: 'Bezirk', dept: '' },
                                                ge: { region: 'Region', dept: 'Gemeinde' },
                                                am: { region: 'Provinz', dept: 'Gemeinde' },
                                                tw: { region: 'Landkreis', dept: 'Bezirk' },
                                                sg: { region: 'Distrikt', dept: '' },

                                                // --- AFRICA ---
                                                za: { region: 'Provinz', dept: 'Distrikt' },
                                                eg: { region: 'Gouvernement', dept: 'Markaz' },
                                                ng: { region: 'Bundesstaat', dept: 'LGA' },
                                                ke: { region: 'County', dept: 'Sub-County' },
                                                ma: { region: 'Region', dept: 'Provinz' },
                                                dz: { region: 'Wilaya', dept: 'Daïra' },
                                                tn: { region: 'Gouvernement', dept: 'Delegation' },
                                                gh: { region: 'Region', dept: 'Distrikt' },
                                                et: { region: 'Region', dept: 'Zone' },
                                                tz: { region: 'Region', dept: 'Distrikt' },
                                                ly: { region: 'Gemeinde', dept: '' },
                                                sd: { region: 'Bundesstaat', dept: 'Distrikt' },
                                                ss: { region: 'Bundesstaat', dept: 'County' },
                                                ml: { region: 'Region', dept: 'Kreis' },
                                                sn: { region: 'Region', dept: 'Departement' },
                                                ci: { region: 'Distrikt', dept: 'Region' },
                                            };

                                        if (labels[cc]) {
                                            labelRegion = labels[cc].region || 'Region';
                                            labelDept = labels[cc].dept || 'Gebiet';
                                        }

                                        let addressParts = [];
                                        
                                        // Prioritized display logic
                                        const city = addrData.city || addrData.town || addrData.village || addrData.hamlet || addrData.municipality;
                                        const county = addrData.county || addrData.district || addrData.province;
                                        const state = addrData.state || addrData.region;
                                        const country = addrData.country;

                                        if (city) addressParts.push(`<b>${city}</b>`);
                                        if (county && county !== city) addressParts.push(`${labelDept}: ${county}`);
                                        if (state && state !== county && state !== city) addressParts.push(`${labelRegion}: ${state}`);
                                        if (country) addressParts.push(country);

                                        let addressString = addressParts.join('<br/>');
                                        if (!addressString) addressString = "Adresse nicht gefunden";

                                        const newContent = `
                                            <div class="popup-container">
                                                <div class="popup-title">Überlappungen: ${smoothing ? val.toFixed(2) : Math.round(val)}</div>
                                                ${participantInfo}
                                                <div class="popup-content">
                                                    <div class="popup-row">Lat: ${lat.toFixed(5)} · Lng: ${lng.toFixed(5)}</div>
                                                    <div class="popup-footer-highlight">
                                                        ${addressString}
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                        
                                        tooltip.setContent(newContent);
                                    };

                                    // Check cache
                                    if (addressCacheRef.current.has(cacheKey)) {
                                        updateTooltip(addressCacheRef.current.get(cacheKey));
                                        return;
                                    }
                                    
                                    // Rate limiting (max 1 request per second globally)
                                    const now = Date.now();
                                    if (now - lastFetchTimeRef.current < 1000) {
                                        return; // Skip if too frequent
                                    }
                                    lastFetchTimeRef.current = now;

                                    try {
                                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=de`);
                                        const data = await response.json();
                                        
                                        const result = data.address || {};
                                        addressCacheRef.current.set(cacheKey, result);
                                        updateTooltip(result);
                                        
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }, 250);

                            } else {
                                if (map.hasLayer(tooltip)) map.removeLayer(tooltip);
                            }
                        } else {
                             if (map.hasLayer(tooltip)) map.removeLayer(tooltip);
                        }
                    };

                    map.on('mousemove', handleMouseMove);

                if (gridSize < CANVAS_THRESHOLD) {
                    // Canvas Rendering
                    const canvas = document.createElement('canvas');
                    canvas.className = 'heatmap-canvas'; // Mark for cleanup
                    if (visualBlur) {
                        canvas.classList.add('heatmap-canvas-blur');
                    }
                    heatCanvasRef.current = canvas;
                    overlayPane.appendChild(canvas);

                    const drawCanvas = () => {
                        if (!heatCanvasRef.current) return;
                        const size = map.getSize();
                        const bounds = map.getBounds();
                        
                        // Correctly position canvas over the viewport
                        const topLeft = map.containerPointToLayerPoint([0, 0]);
                        L.DomUtil.setPosition(canvas, topLeft);

                        // Reset canvas to cover the map viewport
                        canvas.width = size.x;
                        canvas.height = size.y;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Iterate grid and draw visible cells
                        for (let r = 0; r < height; r++) {
                            const lat = (minLatKey + r) * gridSize;
                            if (lat < bounds.getSouth() - gridSize || lat > bounds.getNorth() + gridSize) continue;

                            for (let c = 0; c < width; c++) {
                                const lng = (minLngKey + c) * gridSize;
                                if (lng < bounds.getWest() - gridSize || lng > bounds.getEast() + gridSize) continue;

                                const val = finalGrid[r * width + c];
                                if (val <= 0 || val < minOverlap) continue;

                                const p1 = map.latLngToLayerPoint([lat, lng]);
                                const p2 = map.latLngToLayerPoint([lat + gridSize, lng + gridSize]);
                                
                                // Adjust coordinates relative to canvas (which is at topLeft)
                                const x1 = p1.x - topLeft.x;
                                const y1 = p1.y - topLeft.y;
                                const x2 = p2.x - topLeft.x;
                                const y2 = p2.y - topLeft.y;

                                const w = Math.abs(x2 - x1) + 1;
                                const h = Math.abs(y2 - y1) + 1;

                                const intensity = val / maxCount;
                                ctx.fillStyle = getHeatColor(intensity);
                                ctx.globalAlpha = Math.min(0.8, 0.3 + intensity * 0.7);
                                
                                const x = Math.min(x1, x2);
                                const y = Math.min(y1, y2);
                                
                                ctx.fillRect(x, y, w, h);
                            }
                        }
                    };

                    drawCanvas();
                    map.on('moveend zoomend resize', drawCanvas);
                    
                    // Add Tooltip for Hover
                    const tooltip = L.tooltip({
                        direction: 'top',
                        sticky: true,
                        className: 'heatmap-tooltip',
                        opacity: 0.9,
                        offset: [0, -10]
                    });

                    const handleMouseMove = (e) => {
                        if (!heatmapDataRef.current) return;
                        const { grid, rawGrid, ownerGrid, width, height, minLatKey, minLngKey, gridSize } = heatmapDataRef.current;
                        const { lat, lng } = e.latlng;
                        
                        // Clear any pending fetch
                        if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                        }

                        // Calculate grid index
                        const latKey = Math.floor(lat / gridSize);
                        const lngKey = Math.floor(lng / gridSize);
                        
                        const r = latKey - minLatKey;
                        const c = lngKey - minLngKey;
                        
                        // Check if inside grid bounds
                        if (r >= 0 && r < height && c >= 0 && c < width) {
                             const idx = r * width + c;
                             const val = grid[idx];
                             
                             if (val > 0 && val >= minOverlap) {
                                 const rawVal = rawGrid[idx];
                                 let participantInfo = '';
                                 
                                 // Determine participant ID
                                 let featureIdx = -1;
                                 
                                 if (ownerGrid[idx] >= 0) {
                                     featureIdx = ownerGrid[idx];
                                 } else if (val <= 1.05) {
                                     // Halo search: check neighbors if this is a low-intensity area
                                     // (Likely a smoothed edge of a single participant)
                                     const candidates = new Set();
                                     for (let dr = -1; dr <= 1; dr++) {
                                         for (let dc = -1; dc <= 1; dc++) {
                                             const nr = r + dr;
                                             const nc = c + dc;
                                             if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
                                                 const nIdx = nr * width + nc;
                                                 if (ownerGrid[nIdx] >= 0) {
                                                     candidates.add(ownerGrid[nIdx]);
                                                 }
                                             }
                                         }
                                     }
                                     if (candidates.size === 1) {
                                         featureIdx = candidates.values().next().value;
                                     }
                                 }

                                 if (featureIdx >= 0) {
                                     const feature = filteredFeatures[featureIdx];
                                    if (feature && feature.properties) {
                                        // Try to get participant code from properties (GeoJSON export has participant_code)
                                        const pCode = feature.properties.participant_code || 
                                                      (participantCodes && participantCodes[feature.properties.participant_id]) || 
                                                      feature.properties.participant_id || 
                                                      'Unbekannt';
                                        
                                        participantInfo = `<div class="popup-participant">Proband: ${pCode}</div>`;
                                    }
                                }

                                const content = `
                                    <div class="popup-container">
                                        <div class="popup-title">Überlappungen: ${smoothing ? val.toFixed(2) : Math.round(val)}</div>
                                        ${participantInfo}
                                        <div class="popup-content">
                                            <div class="popup-row">Lat: ${lat.toFixed(5)} · Lng: ${lng.toFixed(5)}</div>
                                            <div class="popup-footer-italic">
                                                Lade Ort...
                                            </div>
                                        </div>
                                    </div>
                                 `;
                                 
                                 tooltip.setLatLng(e.latlng).setContent(content);
                                 if (!map.hasLayer(tooltip)) {
                                     tooltip.addTo(map);
                                 }

                                 // Debounce address fetch
                                  hoverTimeoutRef.current = setTimeout(async () => {
                                      const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
                                      
                                      const updateTooltip = (addrData) => {
                                           let labelRegion = 'Region';
                                           let labelDept = 'Gebiet'; // Default generic
                                           let labelCommune = 'Gemeinde';
                                           
                                           const cc = addrData.country_code ? addrData.country_code.toLowerCase() : '';

                                           // Country-specific labels configuration
                                            const labels = {
                                                // --- EUROPE ---
                                                de: { region: 'Bundesland', dept: 'Landkreis' },
                                                at: { region: 'Bundesland', dept: 'Bezirk' },
                                                ch: { region: 'Kanton', dept: 'Bezirk' },
                                                fr: { region: 'Region', dept: 'Département' },
                                                be: { region: 'Region', dept: 'Provinz' },
                                                nl: { region: 'Provinz', dept: 'Gemeinde' },
                                                lu: { region: 'Kanton', dept: 'Gemeinde' },
                                                ie: { region: 'Provinz', dept: 'County' },
                                                gb: { region: 'Region', dept: 'Grafschaft' },
                                                uk: { region: 'Region', dept: 'Grafschaft' },
                                                it: { region: 'Region', dept: 'Provinz' },
                                                es: { region: 'Region', dept: 'Provinz' },
                                                pt: { region: 'Distrikt', dept: 'Kreis' },
                                                gr: { region: 'Region', dept: 'Regionalbezirk' },
                                                mt: { region: 'Region', dept: 'Distrikt' },
                                                cy: { region: 'Bezirk', dept: 'Gemeinde' },
                                                ad: { region: 'Gemeinde', dept: '' },
                                                sm: { region: 'Gemeinde', dept: '' },
                                                va: { region: '', dept: '' },
                                                mc: { region: 'Quartier', dept: '' },
                                                dk: { region: 'Region', dept: 'Kommune' },
                                                se: { region: 'Provinz', dept: 'Gemeinde' },
                                                no: { region: 'Provinz', dept: 'Gemeinde' },
                                                fi: { region: 'Landschaft', dept: 'Gemeinde' },
                                                is: { region: 'Region', dept: 'Gemeinde' },
                                                pl: { region: 'Woiwodschaft', dept: 'Kreis' },
                                                cz: { region: 'Region', dept: 'Bezirk' },
                                                sk: { region: 'Landschaftsverband', dept: 'Bezirk' },
                                                hu: { region: 'Komitat', dept: 'Kreis' },
                                                ro: { region: 'Kreis', dept: 'Gemeinde' },
                                                bg: { region: 'Oblast', dept: 'Gemeinde' },
                                                hr: { region: 'Gespanschaft', dept: 'Gemeinde' },
                                                si: { region: 'Region', dept: 'Gemeinde' },
                                                ee: { region: 'Landkreis', dept: 'Gemeinde' },
                                                lv: { region: 'Bezirk', dept: 'Gemeinde' },
                                                lt: { region: 'Bezirk', dept: 'Gemeinde' },
                                                ua: { region: 'Oblast', dept: 'Rajon' },
                                                by: { region: 'Woblast', dept: 'Rajon' },
                                                md: { region: 'Rajon', dept: '' },
                                                rs: { region: 'Bezirk', dept: 'Gemeinde' },
                                                ba: { region: 'Kanton', dept: 'Gemeinde' },
                                                mk: { region: 'Region', dept: 'Gemeinde' },
                                                al: { region: 'Qark', dept: 'Gemeinde' },
                                                xk: { region: 'Bezirk', dept: 'Gemeinde' },
                                                me: { region: 'Gemeinde', dept: '' },
                                                ru: { region: 'Oblast', dept: 'Rajon' },
                                                li: { region: 'Oberland/Unterland', dept: 'Gemeinde' },

                                                // --- NORTH AMERICA ---
                                                us: { region: 'Bundesstaat', dept: 'County' },
                                                ca: { region: 'Provinz', dept: 'County' },
                                                mx: { region: 'Bundesstaat', dept: 'Gemeinde' },
                                                gt: { region: 'Departement', dept: 'Gemeinde' },
                                                bz: { region: 'Distrikt', dept: 'Wahlkreis' },
                                                sv: { region: 'Departement', dept: 'Gemeinde' },
                                                hn: { region: 'Departement', dept: 'Gemeinde' },
                                                ni: { region: 'Departement', dept: 'Gemeinde' },
                                                cr: { region: 'Provinz', dept: 'Kanton' },
                                                pa: { region: 'Provinz', dept: 'Distrikt' },
                                                cu: { region: 'Provinz', dept: 'Gemeinde' },
                                                ht: { region: 'Departement', dept: 'Arrondissement' },
                                                do: { region: 'Provinz', dept: 'Gemeinde' },
                                                jm: { region: 'Parish', dept: '' },
                                                tt: { region: 'Region', dept: '' },
                                                bs: { region: 'Distrikt', dept: '' },
                                                bb: { region: 'Parish', dept: '' },

                                                // --- SOUTH AMERICA ---
                                                br: { region: 'Bundesstaat', dept: 'Gemeinde' },
                                                ar: { region: 'Provinz', dept: 'Departement' },
                                                cl: { region: 'Region', dept: 'Provinz' },
                                                co: { region: 'Departement', dept: 'Gemeinde' },
                                                pe: { region: 'Region', dept: 'Provinz' },
                                                ve: { region: 'Bundesstaat', dept: 'Gemeinde' },
                                                ec: { region: 'Provinz', dept: 'Kanton' },
                                                bo: { region: 'Departement', dept: 'Provinz' },
                                                py: { region: 'Departement', dept: 'Distrikt' },
                                                uy: { region: 'Departement', dept: '' },
                                                gy: { region: 'Region', dept: '' },
                                                sr: { region: 'Distrikt', dept: 'Ressort' },

                                                // --- ASIA ---
                                                cn: { region: 'Provinz', dept: 'Präfektur' },
                                                jp: { region: 'Präfektur', dept: 'Bezirk' },
                                                in: { region: 'Bundesstaat', dept: 'Distrikt' },
                                                kr: { region: 'Provinz', dept: 'Stadt/Landkreis' },
                                                id: { region: 'Provinz', dept: 'Regierungsbezirk' },
                                                th: { region: 'Provinz', dept: 'Amphoe' },
                                                vn: { region: 'Provinz', dept: 'Bezirk' },
                                                my: { region: 'Bundesstaat', dept: 'Distrikt' },
                                                ph: { region: 'Provinz', dept: 'Gemeinde' },
                                                pk: { region: 'Provinz', dept: 'Distrikt' },
                                                bd: { region: 'Division', dept: 'Distrikt' },
                                                ir: { region: 'Provinz', dept: 'Schahrestan' },
                                                tr: { region: 'Provinz', dept: 'Distrikt' },
                                                sa: { region: 'Provinz', dept: 'Gouvernement' },
                                                il: { region: 'Bezirk', dept: '' },
                                                ae: { region: 'Emirat', dept: '' },
                                                qa: { region: 'Gemeinde', dept: '' },
                                                kw: { region: 'Gouvernement', dept: '' },
                                                om: { region: 'Gouvernement', dept: 'Wilaya' },
                                                kz: { region: 'Gebiet', dept: 'Bezirk' },
                                                uz: { region: 'Provinz', dept: 'Bezirk' },
                                                tm: { region: 'Provinz', dept: 'Distrikt' },
                                                kg: { region: 'Gebiet', dept: 'Bezirk' },
                                                tj: { region: 'Provinz', dept: 'Distrikt' },
                                                af: { region: 'Provinz', dept: 'Distrikt' },
                                                np: { region: 'Provinz', dept: 'Distrikt' },
                                                lk: { region: 'Provinz', dept: 'Distrikt' },
                                                mm: { region: 'Region', dept: 'Distrikt' },
                                                la: { region: 'Provinz', dept: 'Distrikt' },
                                                kh: { region: 'Provinz', dept: 'Bezirk' },
                                                mn: { region: 'Provinz', dept: 'Sum' },
                                                kp: { region: 'Provinz', dept: 'Kreis' },
                                                sy: { region: 'Gouvernement', dept: 'Distrikt' },
                                                jo: { region: 'Gouvernement', dept: '' },
                                                lb: { region: 'Gouvernement', dept: 'Distrikt' },
                                                ye: { region: 'Gouvernement', dept: 'Distrikt' },
                                                iq: { region: 'Gouvernement', dept: 'Distrikt' },
                                                az: { region: 'Bezirk', dept: '' },
                                                ge: { region: 'Region', dept: 'Gemeinde' },
                                                am: { region: 'Provinz', dept: 'Gemeinde' },
                                                tw: { region: 'Landkreis', dept: 'Bezirk' },
                                                sg: { region: 'Distrikt', dept: '' },

                                                // --- AFRICA ---
                                                za: { region: 'Provinz', dept: 'Distrikt' },
                                                eg: { region: 'Gouvernement', dept: 'Markaz' },
                                                ng: { region: 'Bundesstaat', dept: 'LGA' },
                                                ke: { region: 'County', dept: 'Sub-County' },
                                                ma: { region: 'Region', dept: 'Provinz' },
                                                dz: { region: 'Wilaya', dept: 'Daïra' },
                                                tn: { region: 'Gouvernement', dept: 'Delegation' },
                                                gh: { region: 'Region', dept: 'Distrikt' },
                                                et: { region: 'Region', dept: 'Zone' },
                                                tz: { region: 'Region', dept: 'Distrikt' },
                                                ly: { region: 'Gemeinde', dept: '' },
                                                sd: { region: 'Bundesstaat', dept: 'Distrikt' },
                                                ss: { region: 'Bundesstaat', dept: 'County' },
                                                ml: { region: 'Region', dept: 'Kreis' },
                                                sn: { region: 'Region', dept: 'Departement' },
                                                ci: { region: 'Distrikt', dept: 'Region' },
                                                cm: { region: 'Region', dept: 'Departement' },
                                                ao: { region: 'Provinz', dept: 'Kreis' },
                                                zm: { region: 'Provinz', dept: 'Distrikt' },
                                                zw: { region: 'Provinz', dept: 'Distrikt' },
                                                mz: { region: 'Provinz', dept: 'Distrikt' },
                                                mg: { region: 'Region', dept: 'Distrikt' },
                                                ne: { region: 'Region', dept: 'Departement' },
                                                bf: { region: 'Region', dept: 'Provinz' },
                                                cd: { region: 'Provinz', dept: 'Territorium' },
                                                cg: { region: 'Departement', dept: 'Distrikt' },
                                                ug: { region: 'Distrikt', dept: 'County' },
                                                rw: { region: 'Provinz', dept: 'Distrikt' },
                                                bi: { region: 'Provinz', dept: 'Gemeinde' },
                                                so: { region: 'Region', dept: 'Distrikt' },
                                                cf: { region: 'Präfektur', dept: 'Unterpräfektur' },
                                                td: { region: 'Provinz', dept: 'Departement' },
                                                mr: { region: 'Region', dept: 'Departement' },
                                                bw: { region: 'Distrikt', dept: '' },
                                                na: { region: 'Region', dept: 'Wahlkreis' },
                                                ls: { region: 'Distrikt', dept: '' },
                                                sz: { region: 'Region', dept: 'Tinkhundla' },
                                                
                                                // --- OCEANIA ---
                                                au: { region: 'Bundesstaat', dept: 'LGA' },
                                                nz: { region: 'Region', dept: 'Distrikt' },
                                                pg: { region: 'Provinz', dept: 'Distrikt' },
                                                fj: { region: 'Division', dept: 'Provinz' },
                                                sb: { region: 'Provinz', dept: '' },
                                                vu: { region: 'Provinz', dept: '' }
                                            };

                                           if (labels[cc]) {
                                               labelRegion = labels[cc].region || labelRegion;
                                               labelDept = labels[cc].dept || labelDept;
                                               // Special adjustments
                                               if (cc === 'nl') {
                                                    // NL often returns Province in state. Nominatim structure varies.
                                                    // If we map state->region, then region is Province.
                                                    // Intermediate layer often missing or water board.
                                                    labelDept = ''; // Often skip intermediate if not relevant or use generic
                                               }
                                           }

                                           // Construct admin line, filtering out empty labels or values
                                           const parts = [];
                                           if (addrData.region) parts.push(`${labelRegion}: ${addrData.region}`);
                                           if (addrData.departement && labelDept) parts.push(`${labelDept}: ${addrData.departement}`);
                                           if (addrData.commune) parts.push(`${labelCommune}: ${addrData.commune}`);
                                           
                                           const adminLine = parts.length > 0 ? parts.join(' · ') : 'Ort wird geladen...';
                                           
                                           const newContent = `
                                              <div class="popup-container">
                                                  <div class="popup-title">Überlappungen: ${smoothing ? val.toFixed(2) : Math.round(val)}</div>
                                                  ${participantInfo}
                                                  <div class="popup-content">
                                                      <div class="popup-row">Lat: ${lat.toFixed(5)} · Lng: ${lng.toFixed(5)}</div>
                                                      <div class="popup-footer-highlight">
                                                          ${adminLine}
                                                      </div>
                                                  </div>
                                              </div>
                                           `;
                                           if (map.hasLayer(tooltip)) {
                                              tooltip.setContent(newContent);
                                           }
                                       };

                                      if (addressCacheRef.current.has(cacheKey)) {
                                          updateTooltip(addressCacheRef.current.get(cacheKey));
                                          return;
                                      }

                                      const now = Date.now();
                                      if (now - lastFetchTimeRef.current < 1000) return; // Rate limit 1s
                                      lastFetchTimeRef.current = now;

                                      try {
                                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`, {
                                              headers: { 'Accept-Language': 'de' }
                                          });
                                          const data = await res.json();
                                          
                                          const addr = data?.address || {};
                                          let region, departement, commune;

                                          // Fallback logic similar to original software
                                          // Prioritize state (administrative region) over region (often broader area like 'Metropolitan France')
                                          region = addr.state || addr.region || addr.state_district || undefined;
                                          departement = addr.county || addr.state_district || undefined;
                                          commune = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || addr.suburb || addr.locality || undefined;
                                          const country_code = addr.country_code || undefined;

                                          const result = { region, departement, commune, country_code };
                                          addressCacheRef.current.set(cacheKey, result);
                                          updateTooltip(result);
                                          
                                      } catch (err) {
                                          console.error(err);
                                      }
                                  }, 250);

                             } else {
                                 if (map.hasLayer(tooltip)) map.removeLayer(tooltip);
                             }
                        } else {
                             if (map.hasLayer(tooltip)) map.removeLayer(tooltip);
                        }
                    };

                    map.on('mousemove', handleMouseMove);

                    cleanup = () => {
                        map.off('moveend zoomend', drawCanvas);
                        map.off('mousemove', handleMouseMove);
                        if (map.hasLayer(tooltip)) map.removeLayer(tooltip);
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    };

                } else {
                    // Rectangle Rendering (Legacy for large grids)
                    const batchGroup = L.layerGroup().addTo(map);
                    for (let r = 0; r < height; r++) {
                        for (let c = 0; c < width; c++) {
                            const val = finalGrid[r * width + c];
                            if (val <= 0 || val < minOverlap) continue;

                            const lat = (minLatKey + r) * gridSize;
                            const lng = (minLngKey + c) * gridSize;
                            const intensity = val / maxCount;
                            const color = getHeatColor(intensity);

                            L.rectangle([[lat, lng], [lat + gridSize, lng + gridSize]], {
                                color: color,
                                fillColor: color,
                                fillOpacity: Math.min(0.8, 0.3 + intensity * 0.7),
                                weight: 0,
                                interactive: true
                            }).addTo(batchGroup)
                              .bindPopup(`<div class="popup-container"><div class="popup-row">Wert: ${val.toFixed(2)}</div><div class="popup-row">Intensität: ${(intensity*100).toFixed(0)}%</div></div>`);
                        }
                    }
                    // Register cleanup for layer group
                    cleanup = () => {
                        map.removeLayer(batchGroup);
                        map.off('mousemove', handleMouseMove);
                        if (map.hasLayer(tooltip)) map.removeLayer(tooltip);
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    };
                }
            } catch (error) {
                if (!cancelled) console.error("Error calculating heatmap:", error);
            } finally {
                if (!cancelled) {
                    setIsComputing(false);
                    setProgress(100);
                    setStatusMessage('');
                }
            }
        };

        calculateHeatmap();
        
        return () => {
            cancelled = true;
            cleanup();
        };

    }, [filteredFeatures, gridSize, smoothing, visualBlur, isFullscreen, minOverlap]);

    // Invalidate size on fullscreen toggle or resize
    useEffect(() => {
        // Immediate invalidation for smooth resizing
        if (mapRef.current) {
            // Force Leaflet to update its container size immediately
            mapRef.current.invalidateSize({
                animate: false,
                pan: false
            });
        }
    }, [isFullscreen]);


    return (
      <div className={isFullscreen ? "viewer-fullscreen" : "viewer-card"}>
        {isConfiguring && (
            <div className="config-overlay">
                <div className="config-card">
                    <h3 className="config-header">
                        <Layers size={24} color="#3b82f6" />
                        Fragen auswählen
                    </h3>
                    <p className="config-description">
                        Wählen Sie die Fragen aus, die in die Heatmap einfließen sollen.
                    </p>
                    
                    <div className="config-actions">
                        <span className="selection-count">
                            {tempSelectedQuestions.length} ausgewählt
                        </span>
                        <button 
                            onClick={handleSelectAll}
                            className="btn-link"
                        >
                            {tempSelectedQuestions.length === uniqueQuestions.length ? 'Keine' : 'Alle'} auswählen
                        </button>
                    </div>

                    <div className="question-list-container">
                        {uniqueQuestions.map(qId => (
                            <label key={qId} className="question-item">
                                <input 
                                    type="checkbox" 
                                    checked={tempSelectedQuestions.includes(qId)}
                                    onChange={() => toggleQuestion(qId)}
                                    className="mt-1 cursor-pointer"
                                />
                                <span className="question-text">
                                    {LABELS[qId] || qId}
                                </span>
                            </label>
                        ))}
                    </div>

                    <div className="modal-footer">
                        {hasGenerated && (
                            <button 
                                onClick={() => setIsConfiguring(false)}
                                className="btn-cancel"
                            >
                                Abbrechen
                            </button>
                        )}
                        <button 
                            onClick={handleGenerate}
                            disabled={tempSelectedQuestions.length === 0}
                            className="btn-primary"
                        >
                            Heatmap Generieren
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="analysis-card">
            <div className="d-flex flex-wrap align-center justify-between gap-3">
                
                {/* Header Section */}
                <div className="analysis-header">
                    <div className="analysis-icon-box">
                        <Flame size={24} color="#2563eb" />
                    </div>
                    <div>
                        <h3 className="analysis-title">Heatmap Analyse</h3>
                        <p className="analysis-meta">
                            <span className="meta-badge">
                                {filteredFeatures.length} Maps
                            </span>
                            <span className="separator-dot">•</span>
                            <span>
                                {selectedQuestions.length} {selectedQuestions.length === 1 ? 'Frage' : 'Fragen'} aktiv
                            </span>
                        </p>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="controls-container">
                    
                    {/* Settings Group */}
                    <div className="settings-group">
                        <div className="control-item">
                            <Settings size={16} color="#9ca3af" />
                            <span className="control-label">Raster:</span>
                            <select 
                                value={gridSize} 
                                onChange={(e) => setGridSize(parseFloat(e.target.value))}
                                className="control-select"
                                disabled={isComputing}
                            >
                                <option value={0.05}>Fein (0.05°)</option>
                                <option value={0.1}>Mittel (0.1°)</option>
                                <option value={0.25}>Grob (0.25°)</option>
                                <option value={0.5}>Sehr Grob (0.5°)</option>
                            </select>
                        </div>
                        
                        <div className="divider-vertical"></div>

                        <div className="control-item">
                            <span className="control-label">Filter:</span>
                            <div className="control-item">
                                <input 
                                    type="number" 
                                    min="0"
                                    max="50"
                                    value={minOverlap}
                                    onChange={(e) => setMinOverlap(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="control-input-sm"
                                />
                                <span className="text-sm text-gray-500">Min. Überlappung</span>
                            </div>
                        </div>

                        <div className="divider-vertical"></div>

                        <div className="control-item gap-3">
                            <label className="control-checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={smoothing} 
                                    onChange={(e) => setSmoothing(e.target.checked)}
                                    disabled={isComputing}
                                    className="cursor-pointer"
                                />
                                <span>Daten glätten</span>
                            </label>

                            <label className="control-checkbox-label" title="Visueller Weichzeichner">
                                <input 
                                    type="checkbox" 
                                    checked={visualBlur} 
                                    onChange={(e) => setVisualBlur(e.target.checked)}
                                    disabled={isComputing}
                                    className="cursor-pointer"
                                />
                                <span>Weichzeichnen</span>
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons Group */}
                    <div className="d-flex align-center gap-2 pl-1">
                        <button
                            onClick={() => {
                                setTempSelectedQuestions(selectedQuestions);
                                setIsConfiguring(true);
                            }}
                            disabled={isComputing}
                            className="btn-action"
                            title="Fragen auswählen"
                        >
                            <Layers size={18} color="#6b7280" />
                            <span>Fragen</span>
                        </button>

                        <div className="divider-vertical h-6 mx-1"></div>

                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="btn-icon-only"
                            disabled={!hasGenerated}
                            title={isFullscreen ? "Vollbild beenden" : "Vollbild"}
                        >
                            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        
                        <div className="btn-group">
                            <button
                                onClick={exportHeatmapPng}
                                className="btn-group-item d-flex align-center gap-1 text-xs fw-bold"
                                disabled={!hasGenerated}
                                title="Als PNG speichern"
                            >
                                <Download size={16} /> PNG
                            </button>
                            <button
                                onClick={exportHeatmapJpg}
                                className="btn-group-item d-flex align-center gap-1 text-xs fw-bold"
                                disabled={!hasGenerated}
                                title="Als JPG speichern"
                            >
                                JPG
                            </button>
                            <button
                                onClick={exportHeatmapSvg}
                                className="btn-group-item d-flex align-center gap-1 text-xs fw-bold"
                                disabled={!hasGenerated}
                                title="Als SVG speichern"
                            >
                                SVG
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        
        {isComputing && (
            <div className="progress-container">
                <div className="progress-header">
                    <span>{statusMessage}</span>
                    <span>{progress}%</span>
                </div>
                <div className="progress-track">
                    <div 
                        className="progress-fill"
                        style={{ 
                            width: `${progress}%` 
                        }} 
                    />
                </div>
            </div>
        )}

        <div 
            ref={containerRef} 
            className={`map-container-heatmap ${isFullscreen ? 'map-heatmap-fullscreen' : 'map-heatmap-default'}`}
        >
        </div>
        
      </div>
    );
};

export default MentalMapHeatmap;
