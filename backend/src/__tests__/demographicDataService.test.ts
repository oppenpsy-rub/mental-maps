import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DemographicDataService } from '../services/DemographicDataService';
import { ParticipantRepository } from '../repositories/ParticipantRepository';
import { ResponseRepository } from '../repositories/ResponseRepository';
import { Participant } from '../models/Participant';
import { Response } from '../models/Response';
import { ValidationError } from '../types/errors';

// Mock repositories
vi.mock('../repositories/ParticipantRepository');
vi.mock('../repositories/ResponseRepository');

describe('DemographicDataService', () => {
  let service: DemographicDataService;
  let mockParticipantRepository: any;
  let mockResponseRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DemographicDataService();
    mockParticipantRepository = {
      findById: vi.fn(),
      update: vi.fn(),
      findByStudyId: vi.fn()
    };
    mockResponseRepository = {
      findByParticipant: vi.fn()
    };

    // Replace the repositories in the service
    (service as any).participantRepository = mockParticipantRepository;
    (service as any).responseRepository = mockResponseRepository;
  });

  describe('validateAndSanitizeDemographicData', () => {
    it('should validate and sanitize valid demographic data', () => {
      const inputData = {
        age: 25,
        gender: 'weiblich',
        education: 'bachelor',
        occupation: 'Lehrerin',
        nativeLanguage: 'Deutsch',
        otherLanguages: ['Englisch', 'Französisch'],
        birthPlace: {
          city: 'Berlin',
          region: 'Berlin',
          country: 'Deutschland',
          coordinates: [13.4050, 52.5200]
        },
        dialectBackground: 'Hochdeutsch',
        languageExposure: [
          {
            language: 'Englisch',
            proficiency: 'advanced',
            yearsOfExposure: 15
          }
        ]
      };

      const result = service.validateAndSanitizeDemographicData(inputData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toBeDefined();
      expect(result.sanitizedData!.ageRange).toBe('25-34');
      expect(result.sanitizedData!.age).toBeUndefined(); // Age should be converted to range
      expect(result.sanitizedData!.gender).toBe('weiblich');
      expect(result.sanitizedData!.education).toBe('bachelor');
    });

    it('should reject invalid age values', () => {
      const invalidAgeData = { age: 15 };
      const result = service.validateAndSanitizeDemographicData(invalidAgeData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Age must be between 16 and 120 years');
    });

    it('should convert age to appropriate age ranges', () => {
      const testCases = [
        { age: 17, expectedRange: 'under-18' },
        { age: 20, expectedRange: '18-24' },
        { age: 30, expectedRange: '25-34' },
        { age: 40, expectedRange: '35-44' },
        { age: 50, expectedRange: '45-54' },
        { age: 60, expectedRange: '55-64' },
        { age: 70, expectedRange: '65+' }
      ];

      testCases.forEach(({ age, expectedRange }) => {
        const result = service.validateAndSanitizeDemographicData({ age });
        expect(result.isValid).toBe(true);
        expect(result.sanitizedData!.ageRange).toBe(expectedRange);
      });
    });

    it('should validate education levels', () => {
      const validEducation = { education: 'bachelor' };
      const invalidEducation = { education: 'invalid_level' };

      const validResult = service.validateAndSanitizeDemographicData(validEducation);
      const invalidResult = service.validateAndSanitizeDemographicData(invalidEducation);

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Invalid education level');
    });

    it('should validate and sanitize language exposure', () => {
      const validLanguageExposure = {
        languageExposure: [
          {
            language: 'Englisch',
            proficiency: 'advanced',
            yearsOfExposure: 10
          },
          {
            language: 'Französisch',
            proficiency: 'basic'
          }
        ]
      };

      const invalidLanguageExposure = {
        languageExposure: [
          {
            language: '',
            proficiency: 'invalid',
            yearsOfExposure: -5
          }
        ]
      };

      const validResult = service.validateAndSanitizeDemographicData(validLanguageExposure);
      const invalidResult = service.validateAndSanitizeDemographicData(invalidLanguageExposure);

      expect(validResult.isValid).toBe(true);
      expect(validResult.sanitizedData!.languageExposure).toHaveLength(2);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Language 1: Language name is required');
      expect(invalidResult.errors).toContain('Language 1: Invalid proficiency level');
      expect(invalidResult.errors).toContain('Language 1: Years of exposure must be between 0 and 100');
    });

    it('should validate location coordinates', () => {
      const validLocation = {
        birthPlace: {
          city: 'Berlin',
          coordinates: [13.4050, 52.5200]
        }
      };

      const invalidLocation = {
        birthPlace: {
          city: 'Invalid',
          coordinates: [200, 100] // Invalid coordinates
        }
      };

      const validResult = service.validateAndSanitizeDemographicData(validLocation);
      const invalidResult = service.validateAndSanitizeDemographicData(invalidLocation);

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Birth place: Invalid coordinates range');
    });

    it('should filter out empty strings and arrays', () => {
      const dataWithEmpties = {
        gender: '',
        otherLanguages: ['Englisch', '', 'Französisch', '   '],
        languageExposure: [
          {
            language: 'Englisch',
            proficiency: 'advanced'
          },
          {
            language: '',
            proficiency: 'basic'
          }
        ]
      };

      const result = service.validateAndSanitizeDemographicData(dataWithEmpties);

      expect(result.isValid).toBe(false); // Invalid due to empty language name
      expect(result.sanitizedData).toBeUndefined();
    });

    it('should limit array sizes for security', () => {
      const dataWithManyLanguages = {
        otherLanguages: Array(15).fill('Language'), // More than 10 languages
        languageExposure: Array(25).fill({ // More than 20 exposures
          language: 'Test',
          proficiency: 'basic'
        })
      };

      const result = service.validateAndSanitizeDemographicData(dataWithManyLanguages);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData!.otherLanguages).toHaveLength(10);
      expect(result.sanitizedData!.languageExposure).toHaveLength(20);
    });
  });

  describe('updateParticipantDemographicData', () => {
    it('should update participant demographic data successfully', async () => {
      const participantId = 'participant-123';
      const demographicData = {
        age: 25,
        gender: 'weiblich'
      };

      const existingParticipant = {
        id: participantId,
        demographicData: { education: 'bachelor' }
      } as Participant;

      const updatedParticipant = {
        ...existingParticipant,
        demographicData: {
          education: 'bachelor',
          ageRange: '25-34',
          gender: 'weiblich'
        }
      } as Participant;

      mockParticipantRepository.findById.mockResolvedValue(existingParticipant);
      mockParticipantRepository.update.mockResolvedValue(updatedParticipant);

      const result = await service.updateParticipantDemographicData(participantId, demographicData);

      expect(mockParticipantRepository.findById).toHaveBeenCalledWith(participantId);
      expect(mockParticipantRepository.update).toHaveBeenCalledWith(participantId, {
        demographicData: {
          education: 'bachelor',
          ageRange: '25-34',
          gender: 'weiblich'
        }
      });
      expect(result).toEqual(updatedParticipant);
    });

    it('should throw ValidationError for invalid data', async () => {
      const participantId = 'participant-123';
      const invalidData = { age: 15 }; // Invalid age

      await expect(
        service.updateParticipantDemographicData(participantId, invalidData)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error if participant not found', async () => {
      const participantId = 'nonexistent';
      const demographicData = { age: 25 };

      mockParticipantRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateParticipantDemographicData(participantId, demographicData)
      ).rejects.toThrow('Participant not found');
    });
  });

  describe('getDemographicStatistics', () => {
    it('should calculate demographic statistics correctly', async () => {
      const studyId = 'study-123';
      const participants = [
        {
          id: 'p1',
          demographicData: {
            ageRange: '25-34',
            gender: 'weiblich',
            education: 'bachelor',
            nativeLanguage: 'Deutsch',
            birthPlace: { coordinates: [13.40, 52.52] }
          }
        },
        {
          id: 'p2',
          demographicData: {
            ageRange: '25-34',
            gender: 'männlich',
            education: 'master',
            nativeLanguage: 'Deutsch',
            otherLanguages: ['Englisch']
          }
        }
      ] as Participant[];

      mockParticipantRepository.findByStudyId.mockResolvedValue(participants);

      const stats = await service.getDemographicStatistics(studyId);

      expect(stats.totalParticipants).toBe(2);
      expect(stats.ageDistribution['25-34']).toBe(2);
      expect(stats.genderDistribution['weiblich']).toBe(1);
      expect(stats.genderDistribution['männlich']).toBe(1);
      expect(stats.educationDistribution['bachelor']).toBe(1);
      expect(stats.educationDistribution['master']).toBe(1);
      expect(stats.languageDistribution['Deutsch']).toBe(2);
      expect(stats.languageDistribution['Englisch']).toBe(1);
      expect(stats.geographicDistribution.birthPlaces).toHaveLength(1);
    });

    it('should handle participants with no demographic data', async () => {
      const studyId = 'study-123';
      const participants = [
        { id: 'p1', demographicData: {} },
        { id: 'p2', demographicData: null }
      ] as Participant[];

      mockParticipantRepository.findByStudyId.mockResolvedValue(participants);

      const stats = await service.getDemographicStatistics(studyId);

      expect(stats.totalParticipants).toBe(2);
      expect(Object.keys(stats.ageDistribution)).toHaveLength(0);
      expect(Object.keys(stats.genderDistribution)).toHaveLength(0);
    });
  });

  describe('exportDemographicData', () => {
    it('should export demographic data with response counts', async () => {
      const studyId = 'study-123';
      const participants = [
        {
          id: 'p1',
          studyId,
          demographicData: { ageRange: '25-34' },
          startedAt: new Date('2023-01-01'),
          completedAt: new Date('2023-01-02')
        }
      ] as Participant[];

      const responses = [
        { id: 'r1', participantId: 'p1' },
        { id: 'r2', participantId: 'p1' }
      ] as Response[];

      mockParticipantRepository.findByStudyId.mockResolvedValue(participants);
      mockResponseRepository.findByParticipant.mockResolvedValue(responses);

      const exportData = await service.exportDemographicData(studyId);

      expect(exportData).toHaveLength(1);
      expect(exportData[0].participantId).toBe('p1');
      expect(exportData[0].responseCount).toBe(2);
      expect(exportData[0].completionStatus).toBe('completed');
    });
  });

  describe('linkDemographicDataToResponses', () => {
    it('should link demographic data to responses', async () => {
      const studyId = 'study-123';
      const participants = [
        {
          id: 'p1',
          demographicData: { ageRange: '25-34' }
        }
      ] as Participant[];

      const responses = [
        {
          id: 'r1',
          participantId: 'p1',
          questionId: 'q1',
          responseData: { textResponse: 'test' },
          isTemporary: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        }
      ] as Partial<Response>[];

      mockParticipantRepository.findByStudyId.mockResolvedValue(participants);
      mockResponseRepository.findByParticipant.mockResolvedValue(responses);

      const linkedData = await service.linkDemographicDataToResponses(studyId);

      expect(linkedData).toHaveLength(1);
      expect(linkedData[0].responseId).toBe('r1');
      expect(linkedData[0].demographicData.ageRange).toBe('25-34');
      expect(linkedData[0].responseData.textResponse).toBe('test');
    });
  });
});