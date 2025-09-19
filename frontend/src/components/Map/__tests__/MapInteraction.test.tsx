import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMapInteraction } from '../../../hooks/useMapInteraction';

// Mock Leaflet map
const mockMap = {
  scrollWheelZoom: {
    enable: vi.fn(),
    disable: vi.fn(),
  },
  doubleClickZoom: {
    enable: vi.fn(),
    disable: vi.fn(),
  },
  touchZoom: {
    enable: vi.fn(),
    disable: vi.fn(),
  },
  keyboard: {
    enable: vi.fn(),
    disable: vi.fn(),
  },
  dragging: {
    enable: vi.fn(),
    disable: vi.fn(),
  },
} as any;

// Mock window properties
const mockWindow = {
  innerWidth: 1024,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  maxTouchPoints: 0,
};

describe('useMapInteraction', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock window and navigator
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: mockWindow.innerWidth,
    });
    
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: mockNavigator.userAgent,
    });
    
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: mockNavigator.maxTouchPoints,
    });

    // Mock ontouchstart to simulate no touch support
    delete (window as any).ontouchstart;

    window.addEventListener = mockWindow.addEventListener;
    window.removeEventListener = mockWindow.removeEventListener;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect desktop device capabilities correctly', () => {
    const { result } = renderHook(() => useMapInteraction(null));

    expect(result.current.deviceCapabilities).toEqual({
      isMobile: false,
      isTablet: false,
      hasTouch: false,
      screenSize: 'large',
    });
  });

  it('should detect mobile device capabilities correctly', () => {
    // Mock mobile environment
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    });

    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });

    // Mock ontouchstart to simulate touch support
    (window as any).ontouchstart = {};

    const { result } = renderHook(() => useMapInteraction(null));

    expect(result.current.deviceCapabilities.isMobile).toBe(true);
    expect(result.current.deviceCapabilities.hasTouch).toBe(true);
    expect(result.current.deviceCapabilities.screenSize).toBe('small');
  });

  it('should detect tablet device capabilities correctly', () => {
    // Mock tablet environment
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 10,
    });

    // Mock ontouchstart to simulate touch support
    (window as any).ontouchstart = {};

    const { result } = renderHook(() => useMapInteraction(null));

    expect(result.current.deviceCapabilities.isTablet).toBe(true);
    expect(result.current.deviceCapabilities.hasTouch).toBe(true);
    expect(result.current.deviceCapabilities.screenSize).toBe('medium');
  });

  it('should optimize interaction settings for desktop', () => {
    const { result } = renderHook(() => useMapInteraction(mockMap));

    expect(result.current.interactionSettings).toEqual({
      enableTouchZoom: false, // No touch on desktop
      enableTouchPan: false,  // No touch on desktop
      enableScrollWheelZoom: true,  // Enabled on desktop
      enableDoubleClickZoom: true,
      enableKeyboardNavigation: true, // Enabled on desktop
    });
  });

  it('should apply interaction settings to map', () => {
    renderHook(() => useMapInteraction(mockMap));

    // Verify that map methods were called
    expect(mockMap.scrollWheelZoom.enable).toHaveBeenCalled();
    expect(mockMap.doubleClickZoom.enable).toHaveBeenCalled();
    expect(mockMap.keyboard.enable).toHaveBeenCalled();
    expect(mockMap.dragging.disable).toHaveBeenCalled(); // No touch pan on desktop
    expect(mockMap.touchZoom.disable).toHaveBeenCalled(); // No touch zoom on desktop
  });

  it('should toggle interaction settings', () => {
    const { result } = renderHook(() => useMapInteraction(mockMap));

    act(() => {
      result.current.toggleInteraction('enableScrollWheelZoom');
    });

    expect(result.current.interactionSettings.enableScrollWheelZoom).toBe(false);
  });

  it('should reset to default settings', () => {
    const { result } = renderHook(() => useMapInteraction(mockMap));

    // Toggle some settings
    act(() => {
      result.current.toggleInteraction('enableScrollWheelZoom');
      result.current.toggleInteraction('enableDoubleClickZoom');
    });

    // Reset to defaults
    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.interactionSettings).toEqual({
      enableTouchZoom: true,
      enableTouchPan: true,
      enableScrollWheelZoom: true,
      enableDoubleClickZoom: true,
      enableKeyboardNavigation: true,
    });
  });

  it('should add and remove resize event listener', () => {
    const { unmount } = renderHook(() => useMapInteraction(mockMap));

    expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});