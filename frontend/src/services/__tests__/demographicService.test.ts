import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemographicService } from '../demographicService';
import { DemographicFormData } from '../../components/Forms/DemographicForm';

// Mock axios
const mockAxios = {
  create: vi.fn(() => ({
    put: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn()
      }
    }
  }))
};

vi.mock('axios', () => ({
  default: mockAxios,
}));

describe('DemographicService', () => {
  let service: DemographicService;

  let mockApiInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiInstance = {
      put: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn()
        }
      }
    };
    mockAxios.create.mockReturnValue(mockApiInstance);
    service = new DemographicService();
  });

  describe('updateDemographicData', () => {
    it('should send PUT request to correct endpoint', async () => {
      const mockData: DemographicFormData = {
        age: 25,
        gender: 'weiblich',
        nativeLanguage: 'Deutsch'
      };

      const mockResponse = {
        data: {
          success: true,
          participant: {
            id: 'participant-123',
            demographicData: mockData
          }
        }
      };

      mockApiInstance.put.mockResolvedValue(mockResponse);

      const result = await service.updateDemographicData(mockData);

      expect(mockApiInstance.put).toHaveBeenCalledWith(
        '/auth/participant/demographic',
        { demographicData: mockData }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getDemographicData', () => {
    it('should send GET request to session endpoint', async () => {
      const mockDemographicData = {
        age: 30,
        gender: 'männlich',
        education: 'bachelor'
      };

      const mockResponse = {
        data: {
          demographicData: mockDemographicData
        }
      };

      mockApiInstance.get.mockResolvedValue(mockResponse);

      const result = await service.getDemographicData();

      expect(mockApiInstance.get).toHaveBeenCalledWith('/auth/participant/session');
      expect(result).toEqual(mockDemographicData);
    });
  });

  describe('validateDemographicData', () => {
    it('should validate age range correctly', () => {
      const validData: DemographicFormData = { age: 25 };
      const invalidDataTooYoung: DemographicFormData = { age: 15 };
      const invalidDataTooOld: DemographicFormData = { age: 125 };

      expect(service.validateDemographicData(validData)).toEqual({
        isValid: true,
        errors: []
      });

      expect(service.validateDemographicData(invalidDataTooYoung)).toEqual({
        isValid: false,
        errors: ['Alter muss zwischen 16 und 120 Jahren liegen']
      });

      expect(service.validateDemographicData(invalidDataTooOld)).toEqual({
        isValid: false,
        errors: ['Alter muss zwischen 16 und 120 Jahren liegen']
      });
    });

    it('should validate language exposure data', () => {
      const validData: DemographicFormData = {
        languageExposure: [
          {
            language: 'Englisch',
            proficiency: 'advanced',
            yearsOfExposure: 10
          }
        ]
      };

      const invalidData: DemographicFormData = {
        languageExposure: [
          {
            language: '',
            proficiency: 'basic',
            yearsOfExposure: -5
          },
          {
            language: 'Französisch',
            proficiency: 'intermediate',
            yearsOfExposure: 150
          }
        ]
      };

      expect(service.validateDemographicData(validData)).toEqual({
        isValid: true,
        errors: []
      });

      const result = service.validateDemographicData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Sprache 1: Sprachname ist erforderlich');
      expect(result.errors).toContain('Sprache 1: Jahre der Erfahrung müssen zwischen 0 und 100 liegen');
      expect(result.errors).toContain('Sprache 2: Jahre der Erfahrung müssen zwischen 0 und 100 liegen');
    });

    it('should validate coordinates', () => {
      const validData: DemographicFormData = {
        birthPlace: {
          coordinates: [10.4515, 51.1657]
        },
        currentResidence: {
          coordinates: [-74.006, 40.7128]
        }
      };

      const invalidData: DemographicFormData = {
        birthPlace: {
          coordinates: [200, 100] // Invalid longitude
        },
        currentResidence: {
          coordinates: [0, -100] // Invalid latitude
        }
      };

      expect(service.validateDemographicData(validData)).toEqual({
        isValid: true,
        errors: []
      });

      const result = service.validateDemographicData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Geburtsort: Ungültige Koordinaten');
      expect(result.errors).toContain('Aktueller Wohnort: Ungültige Koordinaten');
    });
  });

  describe('transformFormDataToApiFormat', () => {
    it('should filter out empty strings and arrays', () => {
      const formData: DemographicFormData = {
        age: 25,
        otherLanguages: ['Englisch', '', 'Französisch', '   '],
        languageExposure: [
          {
            language: 'Englisch',
            proficiency: 'advanced'
          },
          {
            language: '',
            proficiency: 'basic'
          },
          {
            language: '   ',
            proficiency: 'intermediate'
          }
        ]
      };

      const result = service.transformFormDataToApiFormat(formData);

      expect(result.otherLanguages).toEqual(['Englisch', 'Französisch']);
      expect(result.languageExposure).toHaveLength(1);
      expect(result.languageExposure![0].language).toBe('Englisch');
    });
  });

  describe('transformApiDataToFormFormat', () => {
    it('should ensure arrays exist', () => {
      const apiData = {
        age: 25,
        gender: 'weiblich'
        // Missing otherLanguages and languageExposure
      };

      const result = service.transformApiDataToFormFormat(apiData);

      expect(result.otherLanguages).toEqual([]);
      expect(result.languageExposure).toEqual([]);
      expect(result.age).toBe(25);
      expect(result.gender).toBe('weiblich');
    });
  });

  describe('getDemographicStatistics', () => {
    it('should fetch statistics for a study', async () => {
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

      mockApiInstance.get.mockResolvedValue({ data: mockStats });

      const result = await service.getDemographicStatistics('study-123');

      expect(mockApiInstance.get).toHaveBeenCalledWith('/studies/study-123/demographics/statistics');
      expect(result).toEqual(mockStats);
    });
  });

  describe('exportDemographicData', () => {
    it('should export data in specified format', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/json' });
      mockApiInstance.get.mockResolvedValue({ data: mockBlob });

      const result = await service.exportDemographicData('study-123', 'json');

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        '/studies/study-123/demographics/export',
        {
          params: { format: 'json' },
          responseType: 'blob'
        }
      );
      expect(result).toBe(mockBlob);
    });

    it('should export data in CSV format', async () => {
      const mockBlob = new Blob(['test,data\n1,2'], { type: 'text/csv' });
      mockApiInstance.get.mockResolvedValue({ data: mockBlob });

      const result = await service.exportDemographicData('study-123', 'csv');

      expect(mockApiInstance.get).toHaveBeenCalledWith(
        '/studies/study-123/demographics/export',
        {
          params: { format: 'csv' },
          responseType: 'blob'
        }
      );
      expect(result).toBe(mockBlob);
    });
  });
});