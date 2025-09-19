import { describe, it, expect } from 'vitest';
import { HeatmapService } from '../services/HeatmapService.js';
import { HeatmapPoint, HeatmapOptions, AggregationMethod } from '../types/heatmap.js';

describe('HeatmapService', () => {
  const mockPoints: HeatmapPoint[] = [
    { x: 100, y: 100, lat: 52.5200, lng: 13.4050, intensity: 0.8 },
    { x: 150, y: 120, lat: 52.5210, lng: 13.4060, intensity: 0.6 },
    { x: 200, y: 180, lat: 52.5220, lng: 13.4070, intensity: 0.9 },
    { x: 120, y: 110, lat: 52.5205, lng: 13.4055, intensity: 0.7 },
    { x: 300, y: 250, lat: 52.5250, lng: 13.4100, intensity: 0.5 }
  ];

  const defaultOptions: HeatmapOptions = {
    radius: 20,
    blur: 0,
    aggregationMethod: AggregationMethod.NONE
  };

  describe('generateHeatmap', () => {
    it('should generate heatmap data with default options', () => {
      const result = HeatmapService.generateHeatmap(mockPoints, defaultOptions);

      expect(result).toBeDefined();
      expect(result.points).toHaveLength(mockPoints.length);
      expect(result.radius).toBe(20);
      expect(result.maxIntensity).toBe(0.9);
      expect(result.gradient).toBeDefined();
    });

    it('should handle empty points array', () => {
      const result = HeatmapService.generateHeatmap([], defaultOptions);

      expect(result.points).toHaveLength(0);
      expect(result.maxIntensity).toBe(1);
      expect(result.radius).toBe(20);
    });

    it('should aggregate points by density', () => {
      const options: HeatmapOptions = {
        ...defaultOptions,
        aggregationMethod: AggregationMethod.DENSITY,
        gridSize: 50
      };

      const result = HeatmapService.generateHeatmap(mockPoints, options);

      expect(result).toBeDefined();
      expect(result.points.length).toBeLessThanOrEqual(mockPoints.length);
    });

    it('should aggregate points by average', () => {
      const options: HeatmapOptions = {
        ...defaultOptions,
        aggregationMethod: AggregationMethod.AVERAGE,
        gridSize: 50
      };

      const result = HeatmapService.generateHeatmap(mockPoints, options);

      expect(result).toBeDefined();
      expect(result.points.length).toBeLessThanOrEqual(mockPoints.length);
    });

    it('should aggregate points by sum', () => {
      const options: HeatmapOptions = {
        ...defaultOptions,
        aggregationMethod: AggregationMethod.SUM,
        gridSize: 50
      };

      const result = HeatmapService.generateHeatmap(mockPoints, options);

      expect(result).toBeDefined();
      expect(result.points.length).toBeLessThanOrEqual(mockPoints.length);
    });

    it('should aggregate points by max', () => {
      const options: HeatmapOptions = {
        ...defaultOptions,
        aggregationMethod: AggregationMethod.MAX,
        gridSize: 50
      };

      const result = HeatmapService.generateHeatmap(mockPoints, options);

      expect(result).toBeDefined();
      expect(result.points.length).toBeLessThanOrEqual(mockPoints.length);
    });
  });

  describe('analyzeHeatmap', () => {
    it('should perform complete heatmap analysis', () => {
      const options: HeatmapOptions = {
        ...defaultOptions,
        hotspotThreshold: 0.7,
        hotspotRadius: 50,
        minHotspotPoints: 2,
        enableClustering: true,
        clusterRadius: 50
      };

      const result = HeatmapService.analyzeHeatmap(mockPoints, options);

      expect(result).toBeDefined();
      expect(result.heatmapData).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalPoints).toBe(mockPoints.length);
      expect(result.statistics.averageIntensity).toBeCloseTo(0.7, 1);
      expect(result.statistics.maxIntensity).toBe(0.9);
      expect(result.statistics.minIntensity).toBe(0.5);
      expect(result.statistics.hotspots).toBeDefined();
      expect(result.clusters).toBeDefined();
    });

    it('should detect hotspots correctly', () => {
      const options: HeatmapOptions = {
        ...defaultOptions,
        hotspotThreshold: 0.6,
        hotspotRadius: 100,
        minHotspotPoints: 2
      };

      const result = HeatmapService.analyzeHeatmap(mockPoints, options);

      expect(result.statistics.hotspots).toBeDefined();
      expect(result.statistics.hotspots.length).toBeGreaterThanOrEqual(0);
      
      if (result.statistics.hotspots.length > 0) {
        const hotspot = result.statistics.hotspots[0];
        expect(hotspot.id).toBeDefined();
        expect(hotspot.centerLat).toBeDefined();
        expect(hotspot.centerLng).toBeDefined();
        expect(hotspot.intensity).toBeGreaterThan(0);
        expect(hotspot.pointCount).toBeGreaterThanOrEqual(2);
      }
    });

    it('should perform clustering when enabled', () => {
      const options: HeatmapOptions = {
        ...defaultOptions,
        enableClustering: true,
        clusterRadius: 100
      };

      const result = HeatmapService.analyzeHeatmap(mockPoints, options);

      expect(result.clusters).toBeDefined();
      expect(result.clusters!.length).toBeGreaterThan(0);
      
      const cluster = result.clusters![0];
      expect(cluster.id).toBeDefined();
      expect(cluster.centerLat).toBeDefined();
      expect(cluster.centerLng).toBeDefined();
      expect(cluster.points).toBeDefined();
      expect(cluster.averageIntensity).toBeGreaterThan(0);
    });

    it('should not perform clustering when disabled', () => {
      const options: HeatmapOptions = {
        ...defaultOptions,
        enableClustering: false
      };

      const result = HeatmapService.analyzeHeatmap(mockPoints, options);

      expect(result.clusters).toBeUndefined();
    });

    it('should handle empty points array in analysis', () => {
      const result = HeatmapService.analyzeHeatmap([], defaultOptions);

      expect(result.statistics.totalPoints).toBe(0);
      expect(result.statistics.averageIntensity).toBe(0);
      expect(result.statistics.maxIntensity).toBe(0);
      expect(result.statistics.minIntensity).toBe(0);
      expect(result.statistics.hotspots).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle points with missing coordinates', () => {
      const pointsWithMissingCoords: HeatmapPoint[] = [
        { intensity: 0.8 },
        { x: 100, intensity: 0.6 },
        { y: 100, intensity: 0.7 },
        { lat: 52.5200, intensity: 0.9 },
        { lng: 13.4050, intensity: 0.5 }
      ];

      const result = HeatmapService.generateHeatmap(pointsWithMissingCoords, defaultOptions);

      expect(result).toBeDefined();
      expect(result.points).toHaveLength(pointsWithMissingCoords.length);
    });

    it('should handle single point', () => {
      const singlePoint: HeatmapPoint[] = [
        { x: 100, y: 100, lat: 52.5200, lng: 13.4050, intensity: 0.8 }
      ];

      const result = HeatmapService.analyzeHeatmap(singlePoint, defaultOptions);

      expect(result.statistics.totalPoints).toBe(1);
      expect(result.statistics.averageIntensity).toBe(0.8);
      expect(result.statistics.maxIntensity).toBe(0.8);
      expect(result.statistics.minIntensity).toBe(0.8);
    });

    it('should handle points with zero intensity', () => {
      const pointsWithZero: HeatmapPoint[] = [
        { x: 100, y: 100, intensity: 0 },
        { x: 150, y: 120, intensity: 0.5 },
        { x: 200, y: 180, intensity: 0 }
      ];

      const result = HeatmapService.analyzeHeatmap(pointsWithZero, defaultOptions);

      expect(result.statistics.totalPoints).toBe(3);
      expect(result.statistics.minIntensity).toBe(0);
      expect(result.statistics.maxIntensity).toBe(0.5);
    });

    it('should handle very large grid sizes', () => {
      const options: HeatmapOptions = {
        ...defaultOptions,
        aggregationMethod: AggregationMethod.DENSITY,
        gridSize: 1000
      };

      const result = HeatmapService.generateHeatmap(mockPoints, options);

      expect(result).toBeDefined();
      expect(result.points.length).toBeLessThanOrEqual(mockPoints.length);
    });

    it('should handle very small grid sizes', () => {
      const options: HeatmapOptions = {
        ...defaultOptions,
        aggregationMethod: AggregationMethod.DENSITY,
        gridSize: 1
      };

      const result = HeatmapService.generateHeatmap(mockPoints, options);

      expect(result).toBeDefined();
      expect(result.points.length).toBeGreaterThan(0);
    });
  });
});