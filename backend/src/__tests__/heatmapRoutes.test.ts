import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { createServer } from '../server';
import { Application } from 'express';
import { AggregationMethod } from '../types/heatmap.js';

// Mock the auth middleware
vi.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'researcher-123', email: 'test@example.com' };
    next();
  }
}));

describe('Heatmap Routes', () => {
  let app: Application;

  beforeAll(async () => {
    app = await createServer();
  });

  describe('POST /api/heatmap/analyze', () => {
    const validAnalysisRequest = {
      studyId: '123e4567-e89b-12d3-a456-426614174000',
      options: {
        radius: 20,
        blur: 0,
        aggregationMethod: AggregationMethod.DENSITY,
        gridSize: 10,
        hotspotThreshold: 0.7,
        hotspotRadius: 50,
        minHotspotPoints: 2,
        enableClustering: true,
        clusterRadius: 50
      }
    };

    it('should analyze heatmap data successfully', async () => {
      const response = await request(app)
        .post('/api/heatmap/analyze')
        .send(validAnalysisRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.heatmapData).toBeDefined();
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.totalPoints).toBeDefined();
      expect(response.body.data.statistics.hotspots).toBeDefined();
      expect(response.body.data.clusters).toBeDefined();
    });

    it('should validate study ID format', async () => {
      const invalidRequest = {
        ...validAnalysisRequest,
        studyId: 'invalid-uuid'
      };

      const response = await request(app)
        .post('/api/heatmap/analyze')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/heatmap/generate', () => {
    const validGenerateRequest = {
      studyId: '123e4567-e89b-12d3-a456-426614174000',
      options: {
        radius: 25,
        blur: 2,
        aggregationMethod: AggregationMethod.AVERAGE
      }
    };

    it('should generate heatmap data successfully', async () => {
      const response = await request(app)
        .post('/api/heatmap/generate')
        .send(validGenerateRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.points).toBeDefined();
      expect(response.body.data.radius).toBe(25);
      expect(response.body.data.maxIntensity).toBeDefined();
      expect(response.body.data.gradient).toBeDefined();
    });
  });

  describe('GET /api/heatmap/export/:studyId', () => {
    const studyId = '123e4567-e89b-12d3-a456-426614174000';

    it('should export heatmap data as JSON', async () => {
      const response = await request(app)
        .get(`/api/heatmap/export/${studyId}`)
        .query({ format: 'json' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.studyId).toBe(studyId);
      expect(response.body.data.exportFormat).toBe('json');
    });

    it('should export heatmap data as GeoJSON', async () => {
      const response = await request(app)
        .get(`/api/heatmap/export/${studyId}`)
        .query({ format: 'geojson' })
        .expect(200);

      expect(response.body.type).toBe('FeatureCollection');
      expect(response.body.features).toBeDefined();
    });

    it('should export heatmap data as CSV', async () => {
      const response = await request(app)
        .get(`/api/heatmap/export/${studyId}`)
        .query({ format: 'csv' })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 501 for PNG export (not implemented)', async () => {
      const response = await request(app)
        .get(`/api/heatmap/export/${studyId}`)
        .query({ format: 'png' })
        .expect(501);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('PNG export not yet implemented');
    });

    it('should validate study ID format', async () => {
      const response = await request(app)
        .get('/api/heatmap/export/invalid-uuid')
        .query({ format: 'json' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate export format', async () => {
      const response = await request(app)
        .get(`/api/heatmap/export/${studyId}`)
        .query({ format: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/heatmap/study/:studyId/statistics', () => {
    const studyId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return heatmap statistics', async () => {
      const response = await request(app)
        .get(`/api/heatmap/study/${studyId}/statistics`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalResponses).toBeDefined();
      expect(response.body.data.totalPoints).toBeDefined();
      expect(response.body.data.averageIntensity).toBeDefined();
      expect(response.body.data.maxIntensity).toBeDefined();
      expect(response.body.data.minIntensity).toBeDefined();
      expect(response.body.data.hotspotCount).toBeDefined();
      expect(response.body.data.clusterCount).toBeDefined();
      expect(response.body.data.coverageArea).toBeDefined();
    });

    it('should validate study ID format', async () => {
      const response = await request(app)
        .get('/api/heatmap/study/invalid-uuid/statistics')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});