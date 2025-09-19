import { useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import { MapState, MapBounds, boundsToMapBounds } from '../types/map';

export const useMap = () => {
  const [mapState, setMapState] = useState<MapState>({
    isLoaded: false,
    currentZoom: 10,
    currentBounds: null,
    currentCenter: null,
    mapInstance: null,
  });

  const mapRef = useRef<L.Map | null>(null);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    setMapState(prev => ({
      ...prev,
      isLoaded: true,
      mapInstance: map,
      currentZoom: map.getZoom(),
      currentBounds: map.getBounds(),
      currentCenter: map.getCenter(),
    }));
  }, []);

  const handleBoundsChange = useCallback((bounds: L.LatLngBounds) => {
    setMapState(prev => ({
      ...prev,
      currentBounds: bounds,
    }));
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setMapState(prev => ({
      ...prev,
      currentZoom: zoom,
    }));
  }, []);

  const fitBounds = useCallback((bounds: MapBounds, options?: L.FitBoundsOptions) => {
    if (mapRef.current) {
      const leafletBounds = L.latLngBounds(
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      );
      mapRef.current.fitBounds(leafletBounds, options);
    }
  }, []);

  const setView = useCallback((center: [number, number], zoom?: number) => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom || mapRef.current.getZoom());
    }
  }, []);

  const flyTo = useCallback((center: [number, number], zoom?: number, options?: L.ZoomPanOptions) => {
    if (mapRef.current) {
      mapRef.current.flyTo(center, zoom || mapRef.current.getZoom(), options);
    }
  }, []);

  const getCurrentBounds = useCallback((): MapBounds | null => {
    if (mapRef.current) {
      return boundsToMapBounds(mapRef.current.getBounds());
    }
    return null;
  }, []);

  const getCurrentCenter = useCallback((): [number, number] | null => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      return [center.lat, center.lng];
    }
    return null;
  }, []);

  const getCurrentZoom = useCallback((): number | null => {
    if (mapRef.current) {
      return mapRef.current.getZoom();
    }
    return null;
  }, []);

  const invalidateSize = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, []);

  return {
    mapState,
    mapRef,
    handlers: {
      onMapReady: handleMapReady,
      onBoundsChange: handleBoundsChange,
      onZoomChange: handleZoomChange,
    },
    actions: {
      fitBounds,
      setView,
      flyTo,
      getCurrentBounds,
      getCurrentCenter,
      getCurrentZoom,
      invalidateSize,
    },
  };
};