import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { studyRoutes } from '../routes/studies';
import { StudyService } from '../services/StudyService';

// Mock the StudyService
vi.mock('../services/StudyService');

// Mock authentication middleware
vi.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.researcher = { id: 'researcher-123' };
    next();
  },
  requireStudyOwnership: () => (_req: any, _res: any, next: any) => {
    next();
  }
}));

// Mock validation middleware
vi.mock('../validation', () => ({
  validateRequest: () => (_req: any, _res: any, next: any) => next(),
  validateQuery: () => (_req: any, _res: any, next: any) => next(),
  createStudySchema: {},
  updateStudySchema: {},
  createQuestionSchema: {},
  updateQuestionSchema: {},
  reorderQuestionsSchema: {},
  studyQuerySchema: {}
}));

describe('Study Status Routes', () => {
  let app: express.Application;
  let mockStudyService: any;
  
  const mockResearcherId = 'researcher-123';
  const mockStudyId = 'study-123';
  
  const mockStudy = {
    id: mockStudyId,
    researcherId: mockResearcherId,
    title: 'Test Study',
    description: 'Test Description',
    settings: {},
    status: 'draft',
    active: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock StudyService
    mockStudyService = {
      activateStudy: vi.fn(),
      deactivateStudy: vi.fn(),
      changeStudyStatus: vi.fn(),
      getStudyStatus: vi.fn()
    };

    vi.mocked(StudyService).mockImplementation(() => mockStudyService);

    // Create test app
    app = express();
    app.use(express.json());
    
    // Add error handling middleware
    app.use('/api/studies', studyRoutes);
    app.use((error: any, _req: any, res: any, _next: any) => {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/studies/:id/activate', () => {
    it('should activate study successfully', async () => {
      mockStudyService.activateStudy.mockResolvedValue({ 
        ...mockStudy, 
        status: 'active', 
        active: true 
      });

      const response = await request(app)
        .post(`/api/studies/${mockStudyId}/activate`)
        .send({ reason: 'Ready for data collection' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(mockStudyService.activateStudy).toHaveBeenCalledWith(
        mockStudyId, 
        mockResearcherId, 
        'Ready for data collection'
      );
    });

    it('should handle activation errors', async () => {
      mockStudyService.activateStudy.mockRejectedValue(
        new Error('Cannot activate study without questions')
      );

      const response = await request(app)
        .post(`/api/studies/${mockStudyId}/activate`)
        .send({ reason: 'Test activation' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot activate study without questions');
    });
  });

  describe('POST /api/studies/:id/deactivate', () => {
    it('should deactivate study successfully', async () => {
      mockStudyService.deactivateStudy.mockResolvedValue({ 
        ...mockStudy, 
        status: 'paused', 
        active: false 
      });

      const response = await request(app)
        .post(`/api/studies/${mockStudyId}/deactivate`)
        .send({ reason: 'Temporary pause' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paused');
      expect(mockStudyService.deactivateStudy).toHaveBeenCalledWith(
        mockStudyId, 
        mockResearcherId, 
        'Temporary pause'
      );
    });

    it('should handle deactivation errors', async () => {
      mockStudyService.deactivateStudy.mockRejectedValue(
        new Error('Only active studies can be deactivated')
      );

      const response = await request(app)
        .post(`/api/studies/${mockStudyId}/deactivate`)
        .send({ reason: 'Test deactivation' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Only active studies can be deactivated');
    });
  });

  describe('PUT /api/studies/:id/status', () => {
    it('should change study status successfully', async () => {
      mockStudyService.changeStudyStatus.mockResolvedValue({ 
        ...mockStudy, 
        status: 'ready' 
      });

      const response = await request(app)
        .put(`/api/studies/${mockStudyId}/status`)
        .send({ status: 'ready', reason: 'All questions configured' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ready');
      expect(mockStudyService.changeStudyStatus).toHaveBeenCalledWith(
        mockStudyId, 
        mockResearcherId, 
        'ready', 
        'All questions configured'
      );
    });

    it('should return 400 when status is missing', async () => {
      const response = await request(app)
        .put(`/api/studies/${mockStudyId}/status`)
        .send({ reason: 'No status provided' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Status is required');
    });

    it('should handle invalid status transitions', async () => {
      mockStudyService.changeStudyStatus.mockRejectedValue(
        new Error('Cannot change status from completed to active')
      );

      const response = await request(app)
        .put(`/api/studies/${mockStudyId}/status`)
        .send({ status: 'active', reason: 'Invalid transition' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot change status from completed to active');
    });
  });

  describe('GET /api/studies/:id/status', () => {
    it('should return study status information', async () => {
      const statusInfo = {
        currentStatus: 'ready',
        statusHistory: [
          {
            status: 'draft',
            timestamp: new Date('2023-01-01'),
            reason: 'Study created',
            changedBy: mockResearcherId
          },
          {
            status: 'ready',
            timestamp: new Date('2023-01-02'),
            reason: 'Questions added',
            changedBy: mockResearcherId
          }
        ],
        validTransitions: ['active', 'draft', 'archived'],
        canActivate: true,
        validationErrors: []
      };

      mockStudyService.getStudyStatus.mockResolvedValue(statusInfo);

      const response = await request(app)
        .get(`/api/studies/${mockStudyId}/status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(statusInfo);
      expect(mockStudyService.getStudyStatus).toHaveBeenCalledWith(
        mockStudyId, 
        mockResearcherId
      );
    });

    it('should return validation errors for incomplete study', async () => {
      const statusInfo = {
        currentStatus: 'draft',
        statusHistory: [],
        validTransitions: ['ready', 'archived'],
        canActivate: false,
        validationErrors: [
          'Study must have at least one question',
          'Study must have map configuration'
        ]
      };

      mockStudyService.getStudyStatus.mockResolvedValue(statusInfo);

      const response = await request(app)
        .get(`/api/studies/${mockStudyId}/status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canActivate).toBe(false);
      expect(response.body.data.validationErrors).toHaveLength(2);
    });

    it('should handle status retrieval errors', async () => {
      mockStudyService.getStudyStatus.mockRejectedValue(
        new Error('Study not found')
      );

      const response = await request(app)
        .get(`/api/studies/${mockStudyId}/status`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Study not found');
    });
  });
});