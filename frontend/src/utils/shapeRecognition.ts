import L from 'leaflet';

export interface RecognizedShape {
  type: 'circle' | 'ellipse' | 'rectangle' | 'line' | 'polygon' | 'freeform' | 'none';
  confidence: number;
  geometry: {
    center?: [number, number];
    radius?: number;
    radiusX?: number;
    radiusY?: number;
    bounds?: [[number, number], [number, number]];
    points?: [number, number][];
  };
  originalShape?: [number, number][];
}

export class ShapeRecognizer {
  private static readonly MIN_POINTS = 3;

  /**
   * FLOM-style shape recognition - simpler and more direct
   */
  static recognizeShape(points: L.LatLng[]): RecognizedShape {
    if (points.length < this.MIN_POINTS) {
      return { type: 'none', confidence: 0, geometry: {} };
    }

    console.log('FLOM-style recognition for', points.length, 'points');

    // FLOM approach: Check basic shape characteristics directly
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const distance = Math.sqrt(
      Math.pow(endPoint.lat - startPoint.lat, 2) + 
      Math.pow(endPoint.lng - startPoint.lng, 2)
    );

    // Check if it's a closed shape (like FLOM's FreeDraw)
    const isClosed = distance < 0.005; // More generous threshold
    
    if (isClosed && points.length > 8) {
      // FLOM-style closed shape analysis
      return this.analyzeClosedShape(points);
    }
    
    // Check for straight lines
    if (points.length > 3) {
      const straightness = this.calculateStraightness(points);
      if (straightness > 0.6) {
        return {
          type: 'line',
          confidence: 0.8,
          geometry: {
            points: [[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]]
          }
        };
      }
    }

    // FLOM fallback: Create a simplified polygon
    return {
      type: 'polygon',
      confidence: 0.7,
      geometry: {
        points: this.simplifyPolygon(points)
      }
    };
  }

  /**
   * FLOM-style closed shape analysis
   */
  private static analyzeClosedShape(points: L.LatLng[]): RecognizedShape {
    // Calculate bounding box
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const aspectRatio = Math.max(latRange, lngRange) / Math.min(latRange, lngRange);

    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Check circularity by measuring distance variance from center
    const distances = points.map(p => 
      Math.sqrt(Math.pow(p.lat - centerLat, 2) + Math.pow(p.lng - centerLng, 2))
    );
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    const coefficientOfVariation = Math.sqrt(variance) / avgDistance;

    console.log('FLOM closed shape analysis:', {
      aspectRatio,
      coefficientOfVariation,
      latRange,
      lngRange,
      avgDistance
    });

    // FLOM-style decision making
    if (aspectRatio < 1.3 && coefficientOfVariation < 0.3) {
      // Very circular - create a proper sized circle
      const radius = Math.max(latRange, lngRange) * 111000 / 2; // Convert to meters
      return {
        type: 'circle',
        confidence: 0.9,
        geometry: {
          center: [centerLat, centerLng],
          radius: Math.max(500, radius) // Minimum 500m radius
        }
      };
    } else if (aspectRatio < 2.0 && coefficientOfVariation < 0.5) {
      // Elliptical
      return {
        type: 'ellipse',
        confidence: 0.8,
        geometry: {
          center: [centerLat, centerLng],
          radiusX: lngRange * 111000 / 2,
          radiusY: latRange * 111000 / 2
        },
        originalShape: points.map(p => [p.lat, p.lng] as [number, number])
      };
    } else {
      // Complex polygon - simplify it
      return {
        type: 'polygon',
        confidence: 0.7,
        geometry: {
          points: this.simplifyPolygon(points)
        }
      };
    }
  }

  /**
   * Improved polygon simplification - keeps more detail
   */
  private static simplifyPolygon(points: L.LatLng[]): [number, number][] {
    // Keep more points for better accuracy
    if (points.length <= 12) {
      return points.map(p => [p.lat, p.lng] as [number, number]);
    }

    // More conservative simplification - keep more detail
    const simplified: L.LatLng[] = [points[0]]; // Always keep first point
    
    // Smaller step size to preserve more detail
    const step = Math.max(1, Math.floor(points.length / 16)); // Was /8, now /16
    
    for (let i = step; i < points.length - step; i += step) {
      // Check if this point represents a significant direction change
      const prev = points[i - step];
      const curr = points[i];
      const next = points[i + step] || points[points.length - 1];
      
      // Calculate angle change
      const v1 = { lat: curr.lat - prev.lat, lng: curr.lng - prev.lng };
      const v2 = { lat: next.lat - curr.lat, lng: next.lng - curr.lng };
      
      const dot = v1.lat * v2.lat + v1.lng * v2.lng;
      const mag1 = Math.sqrt(v1.lat * v1.lat + v1.lng * v1.lng);
      const mag2 = Math.sqrt(v2.lat * v2.lat + v2.lng * v2.lng);
      
      if (mag1 > 0 && mag2 > 0) {
        const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        const angle = Math.acos(cosAngle);
        
        // Lower threshold for including points (more sensitive to direction changes)
        if (angle > 0.2 || simplified.length < 6) { // Was 0.5, now 0.2
          simplified.push(curr);
        }
      }
    }
    
    // Always include last point
    simplified.push(points[points.length - 1]);
    
    // Ensure we have at least 3 points for a polygon, but keep more detail
    if (simplified.length < 3) {
      return points.slice(0, Math.min(12, points.length)).map(p => [p.lat, p.lng] as [number, number]);
    }
    
    return simplified.map(p => [p.lat, p.lng] as [number, number]);
  }

  /**
   * Calculate how straight a line is (0 = very curved, 1 = perfectly straight)
   */
  private static calculateStraightness(points: L.LatLng[]): number {
    if (points.length < 3) return 1;

    const start = points[0];
    const end = points[points.length - 1];
    const directDistance = Math.sqrt(
      Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2)
    );

    if (directDistance === 0) return 0;

    // Calculate total path length
    let pathLength = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      pathLength += Math.sqrt(
        Math.pow(curr.lat - prev.lat, 2) + Math.pow(curr.lng - prev.lng, 2)
      );
    }

    // Straightness is the ratio of direct distance to path length
    return directDistance / pathLength;
  }
}