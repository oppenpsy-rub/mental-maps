import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import demographicRoutes from '../routes/demographics';
import { DemographicDataService } from '../services/DemographicDataService';

// Mock the service
vi.mock('../services/DemographicDataService');

// Mock middleware
vi.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'researcher-123' };
    next();
  }
}));

vi.mock('../middleware/participantAuth', () => ({
  participantAuth: (req: any, res: any, next: any) => {
    req.participant = { id: 'participant-123' };
    next();
  }
}));

describe('Demographics Routes', () => {
  let app: express.Application;
  let mockDemographicService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/demographics', demographicRoutes);

    mockDemographicService = vi.mocked(DemographicDataService.prototype);
  });

  describe('PUT /demographics/participant', () => {
    it('should update participant demographic data successfully', async () => {
      const demographicData = {
        age: 25,
        gender: 'weiblich',
        education: 'bachelor'
      };

      const updatedParticipant = {
        id: 'participant-123',
        demographicData: {
          ageRange: '25-34',
          gender: 'weiblich',
          education: 'bachelor'
        }
      };

      mockDemographicService.updateParticipantDemographicData.mockResolvedValue(updatedParticipant as any);

      const response = await request(app)
        .put('/demographics/participant')
        .send({ demographicData });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.participant.id).toBe('participant-123');
      expect(mockDemographicService.updateParticipantDemographicData).toHaveBeenCalledWith(
        'participant-123',
        demographicData
      );
    });

    it('should return 400 if demographic data is missing', async () => {
      const response = await request(app)
        .put('/demographics/participant')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /demographics/studies/:studyId/statistics', () => {
    it('should return demographic statistics for a study', async () => {
      const studyId = 'study-123';
      const mockStats = {
        totalParticipants: 100,
        ageDistribution: { '25-34': 40, '35-44': 35 },
        genderDistribution: { 'weiblich': 55, 'männlich': 45 },
        educationDistribution: { 'bachelor': 60, 'master': 30 },
        languageDistribution: { 'Deutsch': 90, 'Englisch': 80 },
        geographicDistribution: {
          birthPlaces: [{ coordinates: [10.4515, 51.1657], count: 25 }],
          currentResidences: [{ coordinates: [13.4050, 52.5200], count: 30 }]
        }
      };

      mockDemographicService.getDemographicStatistics.mockResolvedValue(mockStats);

      const response = await request(app)
        .get(`/demographics/studies/${studyId}/statistics`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
      expect(mockDemographicService.getDemographicStatistics).toHaveBeenCalledWith(studyId);
    });
  });

  describe('GET /demographics/studies/:studyId/export', () => {
    it('should export demographic data in JSON format', async () => {
      const studyId = 'study-123';
      const mockExportData = [
        {
          participantId: 'p1',
          studyId,
          demographicData: { ageRange: '25-34', gender: 'weiblich' },
          responseCount: 5,
          completionStatus: 'completed',
          startedAt: new Date('2023-01-01'),
          completedAt: new Date('2023-01-02')
        }
      ];

      mockDemographicService.exportDemographicData.mockResolvedValue(mockExportData);

      const response = await request(app)
        .get(`/demographics/studies/${studyId}/export`)
        .query({ format: 'json' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain(`demographic_data_${studyId}.json`);
      expect(response.body).toEqual(mockExportData);
    });

    it('should export demographic data in CSV format', async () => {
      const studyId = 'study-123';
      const mockExportData = [
        {
          participantId: 'p1',
          studyId,
          demographicData: { 
            ageRange: '25-34', 
            gender: 'weiblich',
            education: 'bachelor',
            nativeLanguage: 'Deutsch',
            otherLanguages: ['Englisch', 'Französisch'],
            birthPlace: {
              city: 'Berlin',
              region: 'Berlin',
              country: 'Deutschland',
              coordinates: [13.4050, 52.5200]
            }
          },
          responseCount: 5,
          completionStatus: 'completed' as const,
          startedAt: new Date('2023-01-01T10:00:00Z'),
          completedAt: new Date('2023-01-02T15:30:00Z')
        }
      ];

      mockDemographicService.exportDemographicData.mockResolvedValue(mockExportData);

      const response = await request(app)
        .get(`/demographics/studies/${studyId}/export`)
        .query({ format: 'csv' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain(`demographic_data_${studyId}.csv`);
      
      const csvContent = response.text;
      expect(csvContent).toContain('participantId,studyId,ageRange');
      expect(csvContent).toContain('p1,study-123,25-34');
      expect(csvContent).toContain('weiblich');
      expect(csvContent).toContain('Berlin');
    });

    it('should return 400 for invalid export format', async () => {
      const studyId = 'study-123';

      const response = await request(app)
        .get(`/demographics/studies/${studyId}/export`)
        .query({ format: 'xml' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /demographics/studies/:studyId/linked-data', () => {
    it('should return linked demographic and response data', async () => {
      const studyId = 'study-123';
      const mockLinkedData = [
        {
          responseId: 'r1',
          demographicData: { ageRange: '25-34', gender: 'weiblich' },
          responseData: { answer: 'test response' },
          createdAt: new Date('2023-01-01')
        }
      ];

      mockDemographicService.linkDemographicDataToResponses.mockResolvedValue(mockLinkedData);

      const response = await request(app)
        .get(`/demographics/studies/${studyId}/linked-data`);

      expect(response.status).toBe(200);
      expect(response.body.studyId).toBe(studyId);
      expect(response.body.totalRecords).toBe(1);
      expect(response.body.data).toEqual(mockLinkedData);
    });
  });

  describe('POST /demographics/validate', () => {
    it('should validate demographic data successfully', async () => {
      const demographicData = {
        age: 25,
        gender: 'weiblich',
        education: 'bachelor'
      };

      const mockValidation = {
        isValid: true,
        errors: [],
        sanitizedData: {
          ageRange: '25-34',
          gender: 'weiblich',
          education: 'bachelor'
        }
      };

      mockDemographicService.validateAndSanitizeDemographicData.mockReturnValue(mockValidation);

      const response = await request(app)
        .post('/demographics/validate')
        .send({ demographicData });

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(true);
      expect(response.body.errors).toEqual([]);
      expect(response.body.sanitizedData).toEqual(mockValidation.sanitizedData);
    });

    it('should return validation errors for invalid data', async () => {
      const demographicData = {
        age: 15, // Invalid age
        gender: 'weiblich'
      };

      const mockValidation = {
        isValid: false,
        errors: ['Age must be between 16 and 120 years'],
        sanitizedData: undefined
      };

      mockDemographicService.validateAndSanitizeDemographicData.mockReturnValue(mockValidation);

      const response = await request(app)
        .post('/demographics/validate')
        .send({ demographicData });

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(false);
      expect(response.body.errors).toContain('Age must be between 16 and 120 years');
    });

    it('should return 400 if demographic data is missing', async () => {
      const response = await request(app)
        .post('/demographics/validate')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});