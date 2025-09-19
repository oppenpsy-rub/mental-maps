import { useState, useEffect, useCallback } from 'react';
import L from 'leaflet';

interface MapInteractionSettings {
  enableTouchZoom: boolean;
  enableTouchPan: boolean;
  enableScrollWheelZoom: boolean;
  enableDoubleClickZoom: boolean;
  enableKeyboardNavigation: boolean;
}

interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  hasTouch: boolean;
  screenSize: 'small' | 'medium' | 'large';
}

export const useMapInteraction = (map: L.Map | null) => {
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    isTablet: false,
    hasTouch: false,
    screenSize: 'large',
  });

  const [interactionSettings, setInteractionSettings] = useState<MapInteractionSettings>({
    enableTouchZoom: true,
    enableTouchPan: true,
    enableScrollWheelZoom: true,
    enableDoubleClickZoom: true,
    enableKeyboardNavigation: true,
  });

  // Detect device capabilities
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const userAgent = navigator.userAgent.toLowerCase();
      
      const isMobile = width < 768 || /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = width >= 768 && width < 1024 && hasTouch;
      
      let screenSize: 'small' | 'medium' | 'large' = 'large';
      if (width < 768) screenSize = 'small';
      else if (width < 1024) screenSize = 'medium';

      setDeviceCapabilities({
        isMobile,
        isTablet,
        hasTouch,
        screenSize,
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Optimize interaction settings based on device
  useEffect(() => {
    if (!map) return;

    const optimizedSettings: MapInteractionSettings = {
      enableTouchZoom: deviceCapabilities.hasTouch,
      enableTouchPan: deviceCapabilities.hasTouch,
      enableScrollWheelZoom: !deviceCapabilities.isMobile, // Disable on mobile to prevent accidental zooming
      enableDoubleClickZoom: true,
      enableKeyboardNavigation: !deviceCapabilities.isMobile,
    };

    setInteractionSettings(optimizedSettings);

    // Apply settings to map
    if (optimizedSettings.enableScrollWheelZoom) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }

    if (optimizedSettings.enableDoubleClickZoom) {
      map.doubleClickZoom.enable();
    } else {
      map.doubleClickZoom.disable();
    }

    if (optimizedSettings.enableTouchZoom) {
      map.touchZoom.enable();
    } else {
      map.touchZoom.disable();
    }

    if (optimizedSettings.enableKeyboardNavigation) {
      map.keyboard.enable();
    } else {
      map.keyboard.disable();
    }

    if (optimizedSettings.enableTouchPan) {
      map.dragging.enable();
    } else {
      map.dragging.disable();
    }

  }, [map, deviceCapabilities]);

  const toggleInteraction = useCallback((setting: keyof MapInteractionSettings) => {
    setInteractionSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setInteractionSettings({
      enableTouchZoom: true,
      enableTouchPan: true,
      enableScrollWheelZoom: true,
      enableDoubleClickZoom: true,
      enableKeyboardNavigation: true,
    });
  }, []);

  return {
    deviceCapabilities,
    interactionSettings,
    toggleInteraction,
    resetToDefaults,
  };
};