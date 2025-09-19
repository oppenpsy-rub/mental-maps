import { describe, it, expect, beforeEach, vi } from 'vitest';
import { studyService } from '../studyService';
import { Study } from '../../types';

// Mock fetch
global.fetch = vi.fn();

const mockStudy: Study = {
  id: '1',
  researcherId: 'researcher1',
  title: 'Test Study',
  description: 'Test Description',
  active: false,
  status: 'draft',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

describe('StudyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  describe('getStudies', () => {
    it('should fetch studies with default options', async () => {
      const mockResponse = {
        success: true,
        data: [mockStudy],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await studyService.getStudies();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies?',
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        }
      );

      expect(result).toEqual({
        studies: [mockStudy],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      });
    });

    it('should fetch studies with custom options', async () => {
      const mockResponse = {
        data: [mockStudy],
        pagination: {
          page: 2,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const options = {
        page: 2,
        limit: 10,
        search: 'test',
        active: true,
        sortBy: 'title',
        sortOrder: 'asc' as const
      };

      await studyService.getStudies(options);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies?page=2&limit=10&search=test&active=true&sortBy=title&sortOrder=asc',
        expect.any(Object)
      );
    });

    it('should handle fetch errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' })
      });

      await expect(studyService.getStudies()).rejects.toThrow('Server error');
    });
  });

  describe('getStudy', () => {
    it('should fetch a single study', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockStudy })
      });

      const result = await studyService.getStudy('1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies/1',
        expect.any(Object)
      );

      expect(result).toEqual(mockStudy);
    });

    it('should fetch study with questions when requested', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockStudy })
      });

      await studyService.getStudy('1', true);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies/1?include=questions',
        expect.any(Object)
      );
    });
  });

  describe('createStudy', () => {
    it('should create a new study', async () => {
      const createData = {
        title: 'New Study',
        description: 'New Description'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockStudy })
      });

      const result = await studyService.createStudy(createData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify(createData)
        }
      );

      expect(result).toEqual(mockStudy);
    });
  });

  describe('updateStudy', () => {
    it('should update an existing study', async () => {
      const updateData = {
        title: 'Updated Study'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockStudy })
      });

      const result = await studyService.updateStudy('1', updateData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies/1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify(updateData)
        }
      );

      expect(result).toEqual(mockStudy);
    });
  });

  describe('deleteStudy', () => {
    it('should delete a study', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true
      });

      await studyService.deleteStudy('1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies/1',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        }
      );
    });

    it('should handle delete errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Study not found' })
      });

      await expect(studyService.deleteStudy('1')).rejects.toThrow('Study not found');
    });
  });

  describe('activateStudy', () => {
    it('should activate a study', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { ...mockStudy, active: true } })
      });

      const result = await studyService.activateStudy('1', 'Test reason');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies/1/activate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({ reason: 'Test reason' })
        }
      );

      expect(result.active).toBe(true);
    });
  });

  describe('deactivateStudy', () => {
    it('should deactivate a study', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { ...mockStudy, active: false } })
      });

      const result = await studyService.deactivateStudy('1', 'Test reason');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies/1/deactivate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({ reason: 'Test reason' })
        }
      );

      expect(result.active).toBe(false);
    });
  });

  describe('getStudyStatistics', () => {
    it('should fetch study statistics', async () => {
      const mockStats = {
        totalStudies: 10,
        activeStudies: 3,
        draftStudies: 5,
        completedStudies: 2,
        totalResponses: 150
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
      });

      const result = await studyService.getStudyStatistics();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies/statistics',
        expect.any(Object)
      );

      expect(result).toEqual(mockStats);
    });
  });

  describe('getStudyStatus', () => {
    it('should fetch study status information', async () => {
      const mockStatus = {
        currentStatus: 'draft',
        statusHistory: [],
        validTransitions: ['ready', 'archived'],
        canActivate: false,
        validationErrors: ['Study must have at least one question']
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockStatus })
      });

      const result = await studyService.getStudyStatus('1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/studies/1/status',
        expect.any(Object)
      );

      expect(result).toEqual(mockStatus);
    });
  });
});