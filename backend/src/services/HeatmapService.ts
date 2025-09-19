import { HeatmapPoint, HeatmapData, HeatmapOptions, AggregationMethod } from '../types/heatmap.js';

export interface HeatmapAnalysisResult {
  heatmapData: HeatmapData;
  statistics: {
    totalPoints: number;
    averageIntensity: number;
    maxIntensity: number;
    minIntensity: number;
    hotspots: HotspotRegion[];
  };
  clusters?: ClusterResult[];
}

export interface HotspotRegion {
  id: string;
  centerLat: number;
  centerLng: number;
  radius: number;
  intensity: number;
  pointCount: number;
}

export interface ClusterResult {
  id: string;
  centerLat: number;
  centerLng: number;
  points: HeatmapPoint[];
  averageIntensity: number;
}

export class HeatmapService {
  /**
   * Generate heatmap data from multiple response points
   */
  static generateHeatmap(
    points: HeatmapPoint[],
    options: HeatmapOptions
  ): HeatmapData {
    if (!points || points.length === 0) {
      return {
        points: [],
        radius: options.radius || 20,
        maxIntensity: 1,
        gradient: options.gradient || this.getDefaultGradient(),
        blur: options.blur || 0
      };
    }

    // Aggregate points based on the specified method
    const aggregatedPoints = this.aggregatePoints(points, options);

    // Calculate max intensity for normalization
    const maxIntensity = Math.max(...aggregatedPoints.map(p => p.intensity));

    return {
      points: aggregatedPoints,
      radius: options.radius || 20,
      maxIntensity,
      gradient: options.gradient || this.getDefaultGradient(),
      blur: options.blur || 0
    };
  }

  /**
   * Analyze heatmap data and generate statistics
   */
  static analyzeHeatmap(
    points: HeatmapPoint[],
    options: HeatmapOptions
  ): HeatmapAnalysisResult {
    const heatmapData = this.generateHeatmap(points, options);
    
    // Calculate basic statistics
    const statistics = this.calculateStatistics(points);
    
    // Detect hotspots
    const hotspots = this.detectHotspots(points, options);
    
    // Perform clustering if requested
    const clusters = options.enableClustering 
      ? this.performClustering(points, options.clusterRadius || 50)
      : undefined;

    return {
      heatmapData,
      statistics: {
        ...statistics,
        hotspots
      },
      clusters
    };
  }

  /**
   * Aggregate points based on the specified method
   */
  private static aggregatePoints(
    points: HeatmapPoint[],
    options: HeatmapOptions
  ): HeatmapPoint[] {
    switch (options.aggregationMethod) {
      case AggregationMethod.DENSITY:
        return this.aggregateByDensity(points, options);
      case AggregationMethod.AVERAGE:
        return this.aggregateByAverage(points, options);
      case AggregationMethod.SUM:
        return this.aggregateBySum(points, options);
      case AggregationMethod.MAX:
        return this.aggregateByMax(points, options);
      default:
        return points;
    }
  }

  /**
   * Aggregate points by density (count of points in proximity)
   */
  private static aggregateByDensity(
    points: HeatmapPoint[],
    options: HeatmapOptions
  ): HeatmapPoint[] {
    const gridSize = options.gridSize || 10; // Grid size in pixels
    const grid = new Map<string, HeatmapPoint[]>();

    // Group points into grid cells
    points.forEach(point => {
      const gridX = Math.floor((point.x || 0) / gridSize);
      const gridY = Math.floor((point.y || 0) / gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(point);
    });

    // Create aggregated points
    const aggregatedPoints: HeatmapPoint[] = [];
    grid.forEach((cellPoints, key) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const centerX = gridX * gridSize + gridSize / 2;
      const centerY = gridY * gridSize + gridSize / 2;
      
      // Calculate average position and density-based intensity
      const avgLat = cellPoints.reduce((sum, p) => sum + (p.lat || 0), 0) / cellPoints.length;
      const avgLng = cellPoints.reduce((sum, p) => sum + (p.lng || 0), 0) / cellPoints.length;
      
      aggregatedPoints.push({
        x: centerX,
        y: centerY,
        lat: avgLat,
        lng: avgLng,
        intensity: cellPoints.length // Density = count of points
      });
    });

    return aggregatedPoints;
  }

  /**
   * Aggregate points by averaging intensities in proximity
   */
  private static aggregateByAverage(
    points: HeatmapPoint[],
    options: HeatmapOptions
  ): HeatmapPoint[] {
    const gridSize = options.gridSize || 10;
    const grid = new Map<string, HeatmapPoint[]>();

    // Group points into grid cells
    points.forEach(point => {
      const gridX = Math.floor((point.x || 0) / gridSize);
      const gridY = Math.floor((point.y || 0) / gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(point);
    });

    // Create aggregated points with average intensity
    const aggregatedPoints: HeatmapPoint[] = [];
    grid.forEach((cellPoints, key) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const centerX = gridX * gridSize + gridSize / 2;
      const centerY = gridY * gridSize + gridSize / 2;
      
      const avgLat = cellPoints.reduce((sum, p) => sum + (p.lat || 0), 0) / cellPoints.length;
      const avgLng = cellPoints.reduce((sum, p) => sum + (p.lng || 0), 0) / cellPoints.length;
      const avgIntensity = cellPoints.reduce((sum, p) => sum + p.intensity, 0) / cellPoints.length;
      
      aggregatedPoints.push({
        x: centerX,
        y: centerY,
        lat: avgLat,
        lng: avgLng,
        intensity: avgIntensity
      });
    });

    return aggregatedPoints;
  }

  /**
   * Aggregate points by summing intensities in proximity
   */
  private static aggregateBySum(
    points: HeatmapPoint[],
    options: HeatmapOptions
  ): HeatmapPoint[] {
    const gridSize = options.gridSize || 10;
    const grid = new Map<string, HeatmapPoint[]>();

    points.forEach(point => {
      const gridX = Math.floor((point.x || 0) / gridSize);
      const gridY = Math.floor((point.y || 0) / gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(point);
    });

    const aggregatedPoints: HeatmapPoint[] = [];
    grid.forEach((cellPoints, key) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const centerX = gridX * gridSize + gridSize / 2;
      const centerY = gridY * gridSize + gridSize / 2;
      
      const avgLat = cellPoints.reduce((sum, p) => sum + (p.lat || 0), 0) / cellPoints.length;
      const avgLng = cellPoints.reduce((sum, p) => sum + (p.lng || 0), 0) / cellPoints.length;
      const sumIntensity = cellPoints.reduce((sum, p) => sum + p.intensity, 0);
      
      aggregatedPoints.push({
        x: centerX,
        y: centerY,
        lat: avgLat,
        lng: avgLng,
        intensity: sumIntensity
      });
    });

    return aggregatedPoints;
  }

  /**
   * Aggregate points by taking maximum intensity in proximity
   */
  private static aggregateByMax(
    points: HeatmapPoint[],
    options: HeatmapOptions
  ): HeatmapPoint[] {
    const gridSize = options.gridSize || 10;
    const grid = new Map<string, HeatmapPoint[]>();

    points.forEach(point => {
      const gridX = Math.floor((point.x || 0) / gridSize);
      const gridY = Math.floor((point.y || 0) / gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(point);
    });

    const aggregatedPoints: HeatmapPoint[] = [];
    grid.forEach((cellPoints, key) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const centerX = gridX * gridSize + gridSize / 2;
      const centerY = gridY * gridSize + gridSize / 2;
      
      const avgLat = cellPoints.reduce((sum, p) => sum + (p.lat || 0), 0) / cellPoints.length;
      const avgLng = cellPoints.reduce((sum, p) => sum + (p.lng || 0), 0) / cellPoints.length;
      const maxIntensity = Math.max(...cellPoints.map(p => p.intensity));
      
      aggregatedPoints.push({
        x: centerX,
        y: centerY,
        lat: avgLat,
        lng: avgLng,
        intensity: maxIntensity
      });
    });

    return aggregatedPoints;
  }

  /**
   * Calculate basic statistics for heatmap points
   */
  private static calculateStatistics(points: HeatmapPoint[]) {
    if (points.length === 0) {
      return {
        totalPoints: 0,
        averageIntensity: 0,
        maxIntensity: 0,
        minIntensity: 0
      };
    }

    const intensities = points.map(p => p.intensity);
    const totalPoints = points.length;
    const averageIntensity = intensities.reduce((sum, i) => sum + i, 0) / totalPoints;
    const maxIntensity = Math.max(...intensities);
    const minIntensity = Math.min(...intensities);

    return {
      totalPoints,
      averageIntensity,
      maxIntensity,
      minIntensity
    };
  }

  /**
   * Detect hotspot regions in the heatmap data
   */
  private static detectHotspots(
    points: HeatmapPoint[],
    options: HeatmapOptions
  ): HotspotRegion[] {
    const hotspots: HotspotRegion[] = [];
    const minIntensityThreshold = options.hotspotThreshold || 0.7;
    const maxIntensity = Math.max(...points.map(p => p.intensity));
    const threshold = maxIntensity * minIntensityThreshold;

    // Find high-intensity points
    const highIntensityPoints = points.filter(p => p.intensity >= threshold);
    
    // Group nearby high-intensity points into hotspots
    const processed = new Set<number>();
    
    highIntensityPoints.forEach((point, index) => {
      if (processed.has(index)) return;
      
      const cluster: HeatmapPoint[] = [point];
      processed.add(index);
      
      // Find nearby points
      for (let i = index + 1; i < highIntensityPoints.length; i++) {
        if (processed.has(i)) continue;
        
        const otherPoint = highIntensityPoints[i];
        const distance = this.calculateDistance(point, otherPoint);
        
        if (distance <= (options.hotspotRadius || 50)) {
          cluster.push(otherPoint);
          processed.add(i);
        }
      }
      
      // Create hotspot if cluster has enough points
      if (cluster.length >= (options.minHotspotPoints || 2)) {
        const centerLat = cluster.reduce((sum, p) => sum + (p.lat || 0), 0) / cluster.length;
        const centerLng = cluster.reduce((sum, p) => sum + (p.lng || 0), 0) / cluster.length;
        const avgIntensity = cluster.reduce((sum, p) => sum + p.intensity, 0) / cluster.length;
        
        hotspots.push({
          id: `hotspot_${hotspots.length + 1}`,
          centerLat,
          centerLng,
          radius: options.hotspotRadius || 50,
          intensity: avgIntensity,
          pointCount: cluster.length
        });
      }
    });

    return hotspots;
  }

  /**
   * Perform clustering analysis on heatmap points
   */
  private static performClustering(
    points: HeatmapPoint[],
    clusterRadius: number
  ): ClusterResult[] {
    const clusters: ClusterResult[] = [];
    const processed = new Set<number>();

    points.forEach((point, index) => {
      if (processed.has(index)) return;

      const cluster: HeatmapPoint[] = [point];
      processed.add(index);

      // Find nearby points for this cluster
      for (let i = index + 1; i < points.length; i++) {
        if (processed.has(i)) continue;

        const otherPoint = points[i];
        const distance = this.calculateDistance(point, otherPoint);

        if (distance <= clusterRadius) {
          cluster.push(otherPoint);
          processed.add(i);
        }
      }

      // Create cluster result
      const centerLat = cluster.reduce((sum, p) => sum + (p.lat || 0), 0) / cluster.length;
      const centerLng = cluster.reduce((sum, p) => sum + (p.lng || 0), 0) / cluster.length;
      const avgIntensity = cluster.reduce((sum, p) => sum + p.intensity, 0) / cluster.length;

      clusters.push({
        id: `cluster_${clusters.length + 1}`,
        centerLat,
        centerLng,
        points: cluster,
        averageIntensity: avgIntensity
      });
    });

    return clusters;
  }

  /**
   * Calculate distance between two points (using Euclidean distance for canvas coordinates)
   */
  private static calculateDistance(point1: HeatmapPoint, point2: HeatmapPoint): number {
    // Use canvas coordinates if available, otherwise use lat/lng
    if (point1.x !== undefined && point1.y !== undefined && 
        point2.x !== undefined && point2.y !== undefined) {
      const dx = point1.x - point2.x;
      const dy = point1.y - point2.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Fallback to geographic distance (simplified)
    if (point1.lat !== undefined && point1.lng !== undefined &&
        point2.lat !== undefined && point2.lng !== undefined) {
      const dlat = point1.lat - point2.lat;
      const dlng = point1.lng - point2.lng;
      return Math.sqrt(dlat * dlat + dlng * dlng) * 111000; // Rough conversion to meters
    }
    
    return 0;
  }

  /**
   * Get default gradient configuration
   */
  private static getDefaultGradient() {
    return {
      0.0: 'rgba(0, 0, 255, 0)',
      0.2: 'rgba(0, 0, 255, 0.5)',
      0.4: 'rgba(0, 255, 255, 0.7)',
      0.6: 'rgba(0, 255, 0, 0.8)',
      0.8: 'rgba(255, 255, 0, 0.9)',
      1.0: 'rgba(255, 0, 0, 1.0)'
    };
  }
}