import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Application } from 'express';
import { createServer } from '../server';

describe('Server', () => {
  let app: Application;

  beforeAll(async () => {
    app = await createServer();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        version: expect.any(String),
        environment: expect.any(String),
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeTypeOf('number');
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Mental Maps API',
        version: expect.any(String),
        status: 'running',
        documentation: '/api/docs',
      });
    });
  });

  describe('API Routes', () => {
    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Mental Maps API v1.0.0',
        endpoints: {
          auth: '/api/auth',
          studies: '/api/studies',
          responses: '/api/responses',
          audio: '/api/audio',
          analysis: '/api/analysis',
        },
      });
    });

    it('should return auth endpoints documentation', async () => {
      const response = await request(app)
        .get('/api/auth')
        .expect(200);

      expect(response.body.message).toBe('Authentication endpoints');
      expect(response.body.endpoints).toBeDefined();
    });

    it('should return studies endpoints documentation', async () => {
      const response = await request(app)
        .get('/api/studies')
        .expect(200);

      expect(response.body.message).toBe('Study management endpoints');
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        type: 'NOT_FOUND',
        message: expect.stringContaining('Route GET /non-existent-route not found'),
        timestamp: expect.any(String),
        path: '/non-existent-route',
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/studies')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });
});