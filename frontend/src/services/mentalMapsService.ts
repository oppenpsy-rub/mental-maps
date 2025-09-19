const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export interface MentalMapElement {
  id: string;
  type: 'point' | 'line' | 'polygon' | 'circle' | 'text' | 'heatmap_point';
  geometry: GeoJSON.Geometry;
  style: {
    color?: string;
    fillColor?: string;
    strokeWidth?: number;
    strokeColor?: string;
    opacity?: number;
    fillOpacity?: number;
    radius?: number;
  };
  metadata?: {
    label?: string;
    description?: string;
    confidence?: number;
    createdWith?: string;
  };
}

export interface MentalMapData {
  responseId: string;
  participantId: string;
  participantCode: string;
  questionId: string;
  questionTitle: string;
  questionText: string;
  responseTimeMs: number;
  responseCreatedAt: string;
  participantCreatedAt: string;
  mapDrawing: {
    id: string;
    bounds: any;
    drawingData: any;
    createdAt: string;
    elements: MentalMapElement[];
  };
}

export interface MentalMapsFilters {
  participantCode?: string;
  questionId?: string;
  dateFrom?: string;
  dateTo?: string;
  hasDrawings?: boolean;
}

class MentalMapsService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get all mental maps for a study
   */
  async getMentalMapsByStudy(studyId: string, filters?: MentalMapsFilters): Promise<MentalMapData[]> {
    const url = new URL(`${API_BASE_URL}/responses/study/${studyId}/mental-maps`);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders()
    });

    const result = await this.handleResponse<{ success: boolean; data: MentalMapData[]; count: number }>(response);
    return result.data;
  }

  /**
   * Get mental map statistics for a study
   */
  async getMentalMapStatistics(studyId: string): Promise<{
    totalMaps: number;
    totalParticipants: number;
    averageResponseTime: number;
    averageElementsPerMap: number;
    elementTypeDistribution: Record<string, number>;
    participationByDate: Array<{ date: string; count: number }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/responses/study/${studyId}/mental-maps/statistics`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const result = await this.handleResponse<{ success: boolean; data: any }>(response);
    return result.data;
  }

  /**
   * Export mental maps data
   */
  async exportMentalMaps(studyId: string, format: 'geojson' | 'csv' | 'json' = 'geojson'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/responses/study/${studyId}/mental-maps/export?format=${format}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Export failed! status: ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Convert mental map elements to Leaflet-compatible format
   */
  convertToLeafletElements(elements: MentalMapElement[]): any[] {
    return elements.map(element => {
      const coords = this.extractCoordinates(element.geometry);
      
      return {
        id: element.id,
        type: this.mapElementTypeToLeaflet(element.type),
        coordinates: coords,
        properties: {
          ...element.style,
          ...element.metadata
        }
      };
    });
  }

  private extractCoordinates(geometry: GeoJSON.Geometry): number[][] {
    switch (geometry.type) {
      case 'Point':
        return [geometry.coordinates as number[]];
      case 'LineString':
        return geometry.coordinates as number[][];
      case 'Polygon':
        return geometry.coordinates[0] as number[][];
      case 'MultiPolygon':
        return geometry.coordinates[0][0] as number[][];
      default:
        return [];
    }
  }

  private mapElementTypeToLeaflet(type: string): string {
    const mapping: Record<string, string> = {
      'point': 'marker',
      'line': 'polyline',
      'polygon': 'polygon',
      'circle': 'circle',
      'text': 'marker',
      'heatmap_point': 'marker'
    };
    return mapping[type] || 'polygon';
  }
}

export const mentalMapsService = new MentalMapsService();
export default mentalMapsService;