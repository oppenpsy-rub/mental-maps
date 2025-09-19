import axios from 'axios';
import {
  HeatmapData,
  HeatmapOptions,
  AnalysisFilters,
  StudyStatistics,
  ClusterResult,
  HotspotRegion,
  OverlayAnalysis,
  AnalysisExportOptions,
  DemographicSegment,
  ComparisonAnalysis
} from '../types/analysis';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class AnalysisService {
  /**
   * Generate heatmap for a study
   */
  static async generateHeatmap(
    studyId: string,
    options: HeatmapOptions,
    filters?: AnalysisFilters
  ): Promise<HeatmapData> {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/heatmap`, {
        studyId,
        options,
        filters
      });
      return response.data;
    } catch (error) {
      console.error('Error generating heatmap:', error);
      throw error;
    }
  }

  /**
   * Get study statistics
   */
  static async getStudyStatistics(
    studyId: string,
    filters?: AnalysisFilters
  ): Promise<StudyStatistics> {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/statistics`, {
        studyId,
        filters
      });
      return response.data;
    } catch (error) {
      console.error('Error getting study statistics:', error);
      throw error;
    }
  }

  /**
   * Detect clusters in study data
   */
  static async detectClusters(
    studyId: string,
    clusterRadius: number = 50,
    filters?: AnalysisFilters
  ): Promise<ClusterResult[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/clusters`, {
        studyId,
        clusterRadius,
        filters
      });
      return response.data;
    } catch (error) {
      console.error('Error detecting clusters:', error);
      throw error;
    }
  }

  /**
   * Detect hotspots in study data
   */
  static async detectHotspots(
    studyId: string,
    options: {
      threshold?: number;
      radius?: number;
      minPoints?: number;
    } = {},
    filters?: AnalysisFilters
  ): Promise<HotspotRegion[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/hotspots`, {
        studyId,
        options,
        filters
      });
      return response.data;
    } catch (error) {
      console.error('Error detecting hotspots:', error);
      throw error;
    }
  }

  /**
   * Create overlay analysis for multiple responses
   */
  static async createOverlayAnalysis(
    studyId: string,
    responseIds: string[],
    name: string
  ): Promise<OverlayAnalysis> {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/overlay`, {
        studyId,
        responseIds,
        name
      });
      return response.data;
    } catch (error) {
      console.error('Error creating overlay analysis:', error);
      throw error;
    }
  }

  /**
   * Get demographic segments for analysis
   */
  static async getDemographicSegments(
    studyId: string
  ): Promise<DemographicSegment[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/analysis/segments/${studyId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting demographic segments:', error);
      throw error;
    }
  }

  /**
   * Compare demographic segments
   */
  static async compareDemographicSegments(
    studyId: string,
    segmentIds: string[]
  ): Promise<ComparisonAnalysis> {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/compare`, {
        studyId,
        segmentIds
      });
      return response.data;
    } catch (error) {
      console.error('Error comparing segments:', error);
      throw error;
    }
  }

  /**
   * Export analysis results
   */
  static async exportAnalysis(
    studyId: string,
    analysisType: 'heatmap' | 'statistics' | 'clusters' | 'overlay',
    options: AnalysisExportOptions
  ): Promise<Blob> {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/export`, {
        studyId,
        analysisType,
        options
      }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting analysis:', error);
      throw error;
    }
  }

  /**
   * Get responses for analysis (with filters)
   */
  static async getFilteredResponses(
    studyId: string,
    filters: AnalysisFilters
  ): Promise<any[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/responses`, {
        studyId,
        filters
      });
      return response.data;
    } catch (error) {
      console.error('Error getting filtered responses:', error);
      throw error;
    }
  }
}