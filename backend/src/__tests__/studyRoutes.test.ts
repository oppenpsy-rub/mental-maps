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

describe('Study Routes', () => {
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
    active: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock StudyService
    mockStudyService = {
      createStudy: vi.fn(),
      getStudiesForResearcher: vi.fn(),
      getStudyById: vi.fn(),
      updateStudy: vi.fn(),
      deleteStudy: vi.fn(),
      activateStudy: vi.fn(),
      deactivateStudy: vi.fn(),
      changeStudyStatus: vi.fn(),
      getStudyStatus: vi.fn(),
      getStudyStatistics: vi.fn(),
      getStudyQuestions: vi.fn(),
      addQuestion: vi.fn(),
      updateQuestion: vi.fn(),
      deleteQuestion: vi.fn(),
      reorderQuestions: vi.fn()
    };

    vi.mocked(StudyService).mockImplementation(() => mockStudyService);

    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api/studies', studyRoutes);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/studies', () => {
    it('should return studies for authenticated researcher', async () => {
      const mockStudies = [mockStudy];
      const mockResult = {
        studies: mockStudies,
        total: 1,
        page: 1,
        limit: 20
      };

      mockStudyService.getStudiesForResearcher.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/studies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStudies);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      });
    });
  });

  describe('POST /api/studies', () => {
    const createData = {
      title: 'New Study',
      description: 'New Description',
      settings: {}
    };

    it('should create a new study', async () => {
      mockStudyService.createStudy.mockResolvedValue({ ...mockStudy, ...createData });

      const response = await request(app)
        .post('/api/studies')
        .send(createData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(createData.title);
      expect(mockStudyService.createStudy).toHaveBeenCalledWith(mockResearcherId, createData);
    });

    it('should return 400 for invalid data', async () => {
      await request(app)
        .post('/api/studies')
        .send({ title: 'ab' }) // Too short
        .expect(400);
    });
  });

  describe('GET /api/studies/:id', () => {
    it('should return study details', async () => {
      mockStudyService.getStudyById.mockResolvedValue(mockStudy);

      const response = await request(app)
        .get(`/api/studies/${mockStudyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStudy);
    });
  });

  describe('PUT /api/studies/:id', () => {
    const updateData = {
      title: 'Updated Study',
      description: 'Updated Description'
    };

    it('should update study', async () => {
      mockStudyService.updateStudy.mockResolvedValue({ ...mockStudy, ...updateData });

      const response = await request(app)
        .put(`/api/studies/${mockStudyId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(mockStudyService.updateStudy).toHaveBeenCalledWith(
        mockStudyId,
        mockResearcherId,
        updateData
      );
    });
  });

  describe('DELETE /api/studies/:id', () => {
    it('should delete study', async () => {
      mockStudyService.deleteStudy.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/studies/${mockStudyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockStudyService.deleteStudy).toHaveBeenCalledWith(mockStudyId, mockResearcherId);
    });
  });

  describe('POST /api/studies/:id/activate', () => {
    it('should activate study', async () => {
      mockStudyService.activateStudy.mockResolvedValue({ ...mockStudy, status: 'active', active: true });

      const response = await request(app)
        .post(`/api/studies/${mockStudyId}/activate`)
        .send({ reason: 'Ready for data collection' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(mockStudyService.activateStudy).toHaveBeenCalledWith(mockStudyId, mockResearcherId, 'Ready for data collection');
    });
  });

  describe('POST /api/studies/:id/deactivate', () => {
    it('should deactivate study', async () => {
      mockStudyService.deactivateStudy.mockResolvedValue({ ...mockStudy, status: 'paused', active: false });

      const response = await request(app)
        .post(`/api/studies/${mockStudyId}/deactivate`)
        .send({ reason: 'Temporary pause' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paused');
      expect(mockStudyService.deactivateStudy).toHaveBeenCalledWith(mockStudyId, mockResearcherId, 'Temporary pause');
    });
  });

  describe('PUT /api/studies/:id/status', () => {
    it('should change study status', async () => {
      mockStudyService.changeStudyStatus.mockResolvedValue({ ...mockStudy, status: 'ready' });

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
      await request(app)
        .put(`/api/studies/${mockStudyId}/status`)
        .send({ reason: 'No status provided' })
        .expect(400);
    });
  });

  describe('GET /api/studies/:id/status', () => {
    it('should return study status information', async () => {
      const statusInfo = {
        currentStatus: 'ready',
        statusHistory: [],
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
      expect(mockStudyService.getStudyStatus).toHaveBeenCalledWith(mockStudyId, mockResearcherId);
    });
  });
});