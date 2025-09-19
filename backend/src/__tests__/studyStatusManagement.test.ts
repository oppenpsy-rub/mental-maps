import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StudyService } from '../services/StudyService';
import { StudyRepository } from '../repositories/StudyRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { Study, StudyStatus } from '../models/Study';
import { Question } from '../models/Question';
import { ApiError, ValidationError } from '../types/errors';

// Mock the repositories
vi.mock('../repositories/StudyRepository');
vi.mock('../repositories/QuestionRepository');

describe('StudyService - Status Management', () => {
  let studyService: StudyService;
  let mockStudyRepository: any;
  let mockQuestionRepository: any;

  const mockResearcherId = 'researcher-123';
  const mockStudyId = 'study-123';

  const mockStudy: Partial<Study> = {
    id: mockStudyId,
    researcherId: mockResearcherId,
    title: 'Test Study',
    description: 'Test Description',
    settings: {
      mapConfiguration: {
        initialBounds: { north: 1, south: 0, east: 1, west: 0 }
      }
    },
    status: StudyStatus.DRAFT,
    active: false,
    statusHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockQuestion: Partial<Question> = {
    id: 'question-123',
    studyId: mockStudyId,
    questionText: 'Test Question',
    questionType: 'map_drawing',
    configuration: {
      allowedDrawingTools: ['pen']
    },
    orderIndex: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStudyRepository = {
      findById: vi.fn(),
      findWithQuestions: vi.fn(),
      update: vi.fn(),
      findByStatus: vi.fn(),
      findByStatusAndResearcher: vi.fn()
    };

    mockQuestionRepository = {
      findByStudy: vi.fn()
    };

    vi.mocked(StudyRepository).mockImplementation(() => mockStudyRepository);
    vi.mocked(QuestionRepository).mockImplementation(() => mockQuestionRepository);

    studyService = new StudyService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('activateStudy', () => {
    it('should activate a ready study with valid questions', async () => {
      const studyWithQuestions = {
        ...mockStudy,
        status: StudyStatus.READY,
        questions: [mockQuestion]
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(studyWithQuestions);
      mockStudyRepository.update.mockResolvedValue({
        ...studyWithQuestions,
        status: StudyStatus.ACTIVE,
        active: true,
        activatedAt: expect.any(Date)
      });

      const result = await studyService.activateStudy(mockStudyId, mockResearcherId, 'Ready for data collection');

      expect(mockStudyRepository.update).toHaveBeenCalledWith(
        mockStudyId,
        expect.objectContaining({
          status: StudyStatus.ACTIVE,
          active: true,
          activatedAt: expect.any(Date),
          statusHistory: expect.arrayContaining([
            expect.objectContaining({
              status: StudyStatus.ACTIVE,
              reason: 'Ready for data collection',
              changedBy: mockResearcherId
            })
          ])
        })
      );
      expect(result.status).toBe(StudyStatus.ACTIVE);
    });

    it('should throw error when study is already active', async () => {
      const activeStudy = {
        ...mockStudy,
        status: StudyStatus.ACTIVE,
        questions: [mockQuestion]
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(activeStudy);

      await expect(studyService.activateStudy(mockStudyId, mockResearcherId))
        .rejects.toThrow(ValidationError);
      
      expect(mockStudyRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when study has no questions', async () => {
      const studyWithoutQuestions = {
        ...mockStudy,
        status: StudyStatus.DRAFT,
        questions: []
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(studyWithoutQuestions);

      await expect(studyService.activateStudy(mockStudyId, mockResearcherId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error when study has questions with empty text', async () => {
      const studyWithInvalidQuestion = {
        ...mockStudy,
        status: StudyStatus.DRAFT,
        questions: [{ ...mockQuestion, questionText: '' }]
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(studyWithInvalidQuestion);

      await expect(studyService.activateStudy(mockStudyId, mockResearcherId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error when trying to activate completed study', async () => {
      const completedStudy = {
        ...mockStudy,
        status: StudyStatus.COMPLETED,
        questions: [mockQuestion]
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(completedStudy);

      await expect(studyService.activateStudy(mockStudyId, mockResearcherId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error for unauthorized access', async () => {
      const studyWithDifferentOwner = {
        ...mockStudy,
        researcherId: 'different-researcher',
        questions: [mockQuestion]
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(studyWithDifferentOwner);

      await expect(studyService.activateStudy(mockStudyId, mockResearcherId))
        .rejects.toThrow(ApiError);
    });
  });

  describe('deactivateStudy', () => {
    it('should deactivate an active study', async () => {
      const activeStudy = {
        ...mockStudy,
        status: StudyStatus.ACTIVE,
        active: true
      };

      mockStudyRepository.findById.mockResolvedValue(activeStudy);
      mockStudyRepository.update.mockResolvedValue({
        ...activeStudy,
        status: StudyStatus.PAUSED,
        active: false,
        deactivatedAt: expect.any(Date)
      });

      const result = await studyService.deactivateStudy(mockStudyId, mockResearcherId, 'Temporary pause');

      expect(mockStudyRepository.update).toHaveBeenCalledWith(
        mockStudyId,
        expect.objectContaining({
          status: StudyStatus.PAUSED,
          active: false,
          deactivatedAt: expect.any(Date),
          statusHistory: expect.arrayContaining([
            expect.objectContaining({
              status: StudyStatus.PAUSED,
              reason: 'Temporary pause',
              changedBy: mockResearcherId
            })
          ])
        })
      );
      expect(result.status).toBe(StudyStatus.PAUSED);
    });

    it('should throw error when trying to deactivate non-active study', async () => {
      const draftStudy = {
        ...mockStudy,
        status: StudyStatus.DRAFT
      };

      mockStudyRepository.findById.mockResolvedValue(draftStudy);

      await expect(studyService.deactivateStudy(mockStudyId, mockResearcherId))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('changeStudyStatus', () => {
    it('should change status from draft to ready', async () => {
      const draftStudy = {
        ...mockStudy,
        status: StudyStatus.DRAFT,
        questions: [mockQuestion]
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(draftStudy);
      mockStudyRepository.update.mockResolvedValue({
        ...draftStudy,
        status: StudyStatus.READY
      });

      const result = await studyService.changeStudyStatus(
        mockStudyId, 
        mockResearcherId, 
        StudyStatus.READY, 
        'Study is ready for activation'
      );

      expect(result.status).toBe(StudyStatus.READY);
    });

    it('should throw error for invalid status transition', async () => {
      const completedStudy = {
        ...mockStudy,
        status: StudyStatus.COMPLETED,
        questions: [mockQuestion]
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(completedStudy);

      await expect(studyService.changeStudyStatus(
        mockStudyId, 
        mockResearcherId, 
        StudyStatus.ACTIVE
      )).rejects.toThrow(ValidationError);
    });

    it('should validate study readiness when changing to active', async () => {
      const readyStudyWithoutQuestions = {
        ...mockStudy,
        status: StudyStatus.READY,
        questions: []
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(readyStudyWithoutQuestions);

      await expect(studyService.changeStudyStatus(
        mockStudyId, 
        mockResearcherId, 
        StudyStatus.ACTIVE
      )).rejects.toThrow(ValidationError);
    });
  });

  describe('getStudyStatus', () => {
    it('should return comprehensive status information', async () => {
      const studyWithHistory = {
        ...mockStudy,
        status: StudyStatus.READY,
        questions: [mockQuestion],
        statusHistory: [
          {
            status: StudyStatus.DRAFT,
            timestamp: new Date('2023-01-01'),
            reason: 'Study created',
            changedBy: mockResearcherId
          },
          {
            status: StudyStatus.READY,
            timestamp: new Date('2023-01-02'),
            reason: 'Questions added',
            changedBy: mockResearcherId
          }
        ]
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(studyWithHistory);

      const result = await studyService.getStudyStatus(mockStudyId, mockResearcherId);

      expect(result).toEqual({
        currentStatus: StudyStatus.READY,
        statusHistory: studyWithHistory.statusHistory,
        validTransitions: ['active', 'draft', 'archived'],
        canActivate: true,
        validationErrors: []
      });
    });

    it('should return validation errors for incomplete study', async () => {
      const incompleteStudy = {
        ...mockStudy,
        status: StudyStatus.DRAFT,
        questions: [],
        settings: {}
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(incompleteStudy);

      const result = await studyService.getStudyStatus(mockStudyId, mockResearcherId);

      expect(result.canActivate).toBe(false);
      expect(result.validationErrors).toContain('Study must have at least one question');
      expect(result.validationErrors).toContain('Study must have map configuration');
    });
  });

  describe('status transition validation', () => {
    const testCases = [
      { from: StudyStatus.DRAFT, to: StudyStatus.READY, valid: true },
      { from: StudyStatus.DRAFT, to: StudyStatus.ARCHIVED, valid: true },
      { from: StudyStatus.DRAFT, to: StudyStatus.ACTIVE, valid: false },
      { from: StudyStatus.READY, to: StudyStatus.ACTIVE, valid: true },
      { from: StudyStatus.READY, to: StudyStatus.DRAFT, valid: true },
      { from: StudyStatus.ACTIVE, to: StudyStatus.PAUSED, valid: true },
      { from: StudyStatus.ACTIVE, to: StudyStatus.COMPLETED, valid: true },
      { from: StudyStatus.ACTIVE, to: StudyStatus.DRAFT, valid: false },
      { from: StudyStatus.PAUSED, to: StudyStatus.ACTIVE, valid: true },
      { from: StudyStatus.COMPLETED, to: StudyStatus.ARCHIVED, valid: true },
      { from: StudyStatus.COMPLETED, to: StudyStatus.ACTIVE, valid: false },
      { from: StudyStatus.ARCHIVED, to: StudyStatus.ACTIVE, valid: false }
    ];

    testCases.forEach(({ from, to, valid }) => {
      it(`should ${valid ? 'allow' : 'reject'} transition from ${from} to ${to}`, async () => {
        const study = {
          ...mockStudy,
          status: from,
          questions: [mockQuestion]
        };

        mockStudyRepository.findWithQuestions.mockResolvedValue(study);

        if (valid) {
          mockStudyRepository.update.mockResolvedValue({ ...study, status: to });
          const result = await studyService.changeStudyStatus(mockStudyId, mockResearcherId, to);
          expect(result.status).toBe(to);
        } else {
          await expect(studyService.changeStudyStatus(mockStudyId, mockResearcherId, to))
            .rejects.toThrow(ValidationError);
        }
      });
    });
  });

  describe('status history tracking', () => {
    it('should track status changes with timestamps and reasons', async () => {
      const study = {
        ...mockStudy,
        status: StudyStatus.DRAFT,
        questions: [mockQuestion],
        statusHistory: []
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(study);
      mockStudyRepository.update.mockImplementation((id: string, updatedStudy: any) => {
        return Promise.resolve(updatedStudy);
      });

      await studyService.changeStudyStatus(
        mockStudyId, 
        mockResearcherId, 
        StudyStatus.READY, 
        'All questions configured'
      );

      expect(mockStudyRepository.update).toHaveBeenCalledWith(
        mockStudyId,
        expect.objectContaining({
          statusHistory: expect.arrayContaining([
            expect.objectContaining({
              status: StudyStatus.READY,
              timestamp: expect.any(Date),
              reason: 'All questions configured',
              changedBy: mockResearcherId
            })
          ])
        })
      );
    });
  });
});