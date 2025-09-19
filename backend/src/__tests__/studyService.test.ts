import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StudyService } from '../services/StudyService';
import { StudyRepository } from '../repositories/StudyRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { Study } from '../models/Study';
import { Question } from '../models/Question';
import { ApiError, ValidationError } from '../types/errors';

// Mock the repositories
vi.mock('../repositories/StudyRepository');
vi.mock('../repositories/QuestionRepository');

describe('StudyService', () => {
  let studyService: StudyService;
  let mockStudyRepository: any;
  let mockQuestionRepository: any;

  const mockResearcherId = 'researcher-123';
  const mockStudyId = 'study-123';
  const mockQuestionId = 'question-123';

  const mockStudy: Partial<Study> = {
    id: mockStudyId,
    researcherId: mockResearcherId,
    title: 'Test Study',
    description: 'Test Description',
    settings: {},
    active: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockQuestion: Partial<Question> = {
    id: mockQuestionId,
    studyId: mockStudyId,
    questionText: 'Test Question',
    questionType: 'map_drawing',
    configuration: {
      allowedDrawingTools: ['pen'],
      colors: ['#FF0000']
    },
    orderIndex: 0
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock instances
    mockStudyRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByResearcher: vi.fn(),
      findWithQuestions: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      activate: vi.fn(),
      deactivate: vi.fn(),
      getStudyStatistics: vi.fn()
    };

    mockQuestionRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByStudy: vi.fn(),
      findByIds: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateOrderIndex: vi.fn(),
      shiftQuestionsOrder: vi.fn(),
      reorderQuestion: vi.fn()
    };

    // Mock the constructor calls
    vi.mocked(StudyRepository).mockImplementation(() => mockStudyRepository);
    vi.mocked(QuestionRepository).mockImplementation(() => mockQuestionRepository);

    studyService = new StudyService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createStudy', () => {
    it('should create a new study successfully', async () => {
      const createData = {
        title: 'New Study',
        description: 'New Description',
        settings: { test: true }
      };

      mockStudyRepository.findByResearcher.mockResolvedValue([]);
      mockStudyRepository.create.mockResolvedValue({ ...mockStudy, ...createData });

      const result = await studyService.createStudy(mockResearcherId, createData);

      expect(mockStudyRepository.findByResearcher).toHaveBeenCalledWith(mockResearcherId);
      expect(mockStudyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          researcherId: mockResearcherId,
          title: createData.title,
          description: createData.description,
          settings: createData.settings,
          active: false
        })
      );
      expect(result).toEqual(expect.objectContaining(createData));
    });

    it('should throw ValidationError for duplicate title', async () => {
      const createData = {
        title: 'Existing Study',
        description: 'Description'
      };

      mockStudyRepository.findByResearcher.mockResolvedValue([
        { ...mockStudy, title: 'Existing Study' }
      ]);

      await expect(studyService.createStudy(mockResearcherId, createData))
        .rejects.toThrow(ValidationError);
      
      expect(mockStudyRepository.create).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive duplicate title check', async () => {
      const createData = {
        title: 'EXISTING STUDY',
        description: 'Description'
      };

      mockStudyRepository.findByResearcher.mockResolvedValue([
        { ...mockStudy, title: 'existing study' }
      ]);

      await expect(studyService.createStudy(mockResearcherId, createData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getStudiesForResearcher', () => {
    const mockStudies = [
      { ...mockStudy, title: 'Study A', active: true, createdAt: new Date('2023-01-01') },
      { ...mockStudy, title: 'Study B', active: false, createdAt: new Date('2023-01-02') },
      { ...mockStudy, title: 'Another Study', active: true, createdAt: new Date('2023-01-03') }
    ];

    beforeEach(() => {
      mockStudyRepository.findByResearcher.mockResolvedValue(mockStudies);
    });

    it('should return paginated studies', async () => {
      const result = await studyService.getStudiesForResearcher(mockResearcherId, {
        page: 1,
        limit: 2
      });

      expect(result.studies).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should filter by search term', async () => {
      const result = await studyService.getStudiesForResearcher(mockResearcherId, {
        search: 'Study A'
      });

      expect(result.studies).toHaveLength(1);
      expect(result.studies[0].title).toBe('Study A');
    });

    it('should filter by active status', async () => {
      const result = await studyService.getStudiesForResearcher(mockResearcherId, {
        active: true
      });

      expect(result.studies).toHaveLength(2);
      expect(result.studies.every(s => s.active)).toBe(true);
    });

    it('should sort by title ascending', async () => {
      const result = await studyService.getStudiesForResearcher(mockResearcherId, {
        sortBy: 'title',
        sortOrder: 'asc'
      });

      expect(result.studies[0].title).toBe('Another Study');
      expect(result.studies[1].title).toBe('Study A');
      expect(result.studies[2].title).toBe('Study B');
    });
  });

  describe('updateStudy', () => {
    it('should update study successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description'
      };

      mockStudyRepository.findById.mockResolvedValue(mockStudy);
      mockStudyRepository.findByResearcher.mockResolvedValue([]);
      mockStudyRepository.update.mockResolvedValue({ ...mockStudy, ...updateData });

      const result = await studyService.updateStudy(mockStudyId, mockResearcherId, updateData);

      expect(mockStudyRepository.update).toHaveBeenCalledWith(
        mockStudyId,
        expect.objectContaining(updateData)
      );
      expect(result).toEqual(expect.objectContaining(updateData));
    });

    it('should throw error for non-existent study', async () => {
      mockStudyRepository.findById.mockResolvedValue(null);

      await expect(studyService.updateStudy(mockStudyId, mockResearcherId, {}))
        .rejects.toThrow(ApiError);
    });

    it('should throw error for unauthorized access', async () => {
      mockStudyRepository.findById.mockResolvedValue({
        ...mockStudy,
        researcherId: 'different-researcher'
      });

      await expect(studyService.updateStudy(mockStudyId, mockResearcherId, {}))
        .rejects.toThrow(ApiError);
    });

    it('should check for duplicate title when updating', async () => {
      const updateData = { title: 'Existing Title' };

      mockStudyRepository.findById.mockResolvedValue(mockStudy);
      mockStudyRepository.findByResearcher.mockResolvedValue([
        { ...mockStudy, id: 'different-id', title: 'Existing Title' }
      ]);

      await expect(studyService.updateStudy(mockStudyId, mockResearcherId, updateData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('deleteStudy', () => {
    it('should delete inactive study successfully', async () => {
      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: false });
      mockStudyRepository.delete.mockResolvedValue(undefined);

      await studyService.deleteStudy(mockStudyId, mockResearcherId);

      expect(mockStudyRepository.delete).toHaveBeenCalledWith(mockStudyId);
    });

    it('should throw error when trying to delete active study', async () => {
      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: true });

      await expect(studyService.deleteStudy(mockStudyId, mockResearcherId))
        .rejects.toThrow(ValidationError);
      
      expect(mockStudyRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('activateStudy', () => {
    it('should activate study with questions successfully', async () => {
      const studyWithQuestions = {
        ...mockStudy,
        status: 'ready',
        settings: { mapConfiguration: { initialBounds: {} } },
        questions: [mockQuestion]
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(studyWithQuestions);
      mockStudyRepository.update.mockResolvedValue({ ...studyWithQuestions, status: 'active', active: true });

      const result = await studyService.activateStudy(mockStudyId, mockResearcherId);

      expect(mockStudyRepository.update).toHaveBeenCalledWith(
        mockStudyId,
        expect.objectContaining({
          status: 'active',
          active: true
        })
      );
      expect(result.status).toBe('active');
    });

    it('should throw error when activating study without questions', async () => {
      mockStudyRepository.findWithQuestions.mockResolvedValue({
        ...mockStudy,
        status: 'draft',
        questions: []
      });

      await expect(studyService.activateStudy(mockStudyId, mockResearcherId))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error when activating study with empty question text', async () => {
      const studyWithInvalidQuestion = {
        ...mockStudy,
        status: 'draft',
        settings: { mapConfiguration: { initialBounds: {} } },
        questions: [{ ...mockQuestion, questionText: '' }]
      };

      mockStudyRepository.findWithQuestions.mockResolvedValue(studyWithInvalidQuestion);

      await expect(studyService.activateStudy(mockStudyId, mockResearcherId))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('addQuestion', () => {
    const questionData = {
      questionText: 'New Question',
      questionType: 'map_drawing',
      configuration: { 
        allowedDrawingTools: ['pen', 'polygon'],
        colors: ['#FF0000']
      }
    };

    it('should add question to inactive study successfully', async () => {
      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: false });
      mockQuestionRepository.findByStudy.mockResolvedValue([]);
      mockQuestionRepository.create.mockResolvedValue({ ...mockQuestion, ...questionData });

      const result = await studyService.addQuestion(mockStudyId, mockResearcherId, questionData);

      expect(mockQuestionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studyId: mockStudyId,
          ...questionData,
          orderIndex: 0
        })
      );
      expect(result).toEqual(expect.objectContaining(questionData));
    });

    it('should throw error when adding question to active study', async () => {
      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: true });

      await expect(studyService.addQuestion(mockStudyId, mockResearcherId, questionData))
        .rejects.toThrow(ValidationError);
    });

    it('should handle custom order index', async () => {
      const existingQuestions = [
        { ...mockQuestion, orderIndex: 0 },
        { ...mockQuestion, orderIndex: 1 }
      ];

      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: false });
      mockQuestionRepository.findByStudy.mockResolvedValue(existingQuestions);
      mockQuestionRepository.shiftQuestionsOrder.mockResolvedValue(undefined);
      mockQuestionRepository.create.mockResolvedValue({ 
        ...mockQuestion, 
        ...questionData, 
        orderIndex: 1 
      });

      const questionWithOrder = { ...questionData, orderIndex: 1 };
      await studyService.addQuestion(mockStudyId, mockResearcherId, questionWithOrder);

      expect(mockQuestionRepository.shiftQuestionsOrder).toHaveBeenCalledWith(mockStudyId, 1, 1);
    });
  });

  describe('updateQuestion', () => {
    const updateData = {
      questionText: 'Updated Question',
      configuration: { 
        allowedDrawingTools: ['pen', 'polygon'],
        colors: ['#FF0000']
      }
    };

    it('should update question in inactive study successfully', async () => {
      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: false });
      mockQuestionRepository.findById.mockResolvedValue(mockQuestion);
      mockQuestionRepository.update.mockResolvedValue({ ...mockQuestion, ...updateData });

      const result = await studyService.updateQuestion(
        mockStudyId, 
        mockQuestionId, 
        mockResearcherId, 
        updateData
      );

      expect(mockQuestionRepository.update).toHaveBeenCalledWith(
        mockQuestionId,
        expect.objectContaining(updateData)
      );
      expect(result).toEqual(expect.objectContaining(updateData));
    });

    it('should throw error when updating question in active study', async () => {
      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: true });

      await expect(studyService.updateQuestion(
        mockStudyId, 
        mockQuestionId, 
        mockResearcherId, 
        updateData
      )).rejects.toThrow(ValidationError);
    });

    it('should handle order index changes', async () => {
      const updateWithOrder = { ...updateData, orderIndex: 2 };

      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: false });
      mockQuestionRepository.findById.mockResolvedValue({ ...mockQuestion, orderIndex: 0 });
      mockQuestionRepository.reorderQuestion.mockResolvedValue(undefined);
      mockQuestionRepository.update.mockResolvedValue({ 
        ...mockQuestion, 
        ...updateWithOrder 
      });

      await studyService.updateQuestion(
        mockStudyId, 
        mockQuestionId, 
        mockResearcherId, 
        updateWithOrder
      );

      expect(mockQuestionRepository.reorderQuestion).toHaveBeenCalledWith(
        mockQuestionId, 
        0, 
        2
      );
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question from inactive study successfully', async () => {
      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: false });
      mockQuestionRepository.findById.mockResolvedValue({ ...mockQuestion, orderIndex: 1 });
      mockQuestionRepository.shiftQuestionsOrder.mockResolvedValue(undefined);
      mockQuestionRepository.delete.mockResolvedValue(undefined);

      await studyService.deleteQuestion(mockStudyId, mockQuestionId, mockResearcherId);

      expect(mockQuestionRepository.shiftQuestionsOrder).toHaveBeenCalledWith(mockStudyId, 2, -1);
      expect(mockQuestionRepository.delete).toHaveBeenCalledWith(mockQuestionId);
    });

    it('should throw error when deleting question from active study', async () => {
      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: true });

      await expect(studyService.deleteQuestion(mockStudyId, mockQuestionId, mockResearcherId))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('reorderQuestions', () => {
    const questionOrders = [
      { questionId: 'q1', orderIndex: 0 },
      { questionId: 'q2', orderIndex: 1 }
    ];

    it('should reorder questions successfully', async () => {
      const questions = [
        { ...mockQuestion, id: 'q1', studyId: mockStudyId },
        { ...mockQuestion, id: 'q2', studyId: mockStudyId }
      ];

      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: false });
      mockQuestionRepository.findByIds.mockResolvedValue(questions);
      mockQuestionRepository.updateOrderIndex.mockResolvedValue(undefined);
      mockQuestionRepository.findByStudy.mockResolvedValue(questions);

      const result = await studyService.reorderQuestions(
        mockStudyId, 
        mockResearcherId, 
        questionOrders
      );

      expect(mockQuestionRepository.updateOrderIndex).toHaveBeenCalledTimes(2);
      expect(result).toEqual(questions);
    });

    it('should throw error when question belongs to different study', async () => {
      const questions = [
        { ...mockQuestion, id: 'q1', studyId: 'different-study' }
      ];

      mockStudyRepository.findById.mockResolvedValue({ ...mockStudy, active: false });
      mockQuestionRepository.findByIds.mockResolvedValue(questions);

      await expect(studyService.reorderQuestions(
        mockStudyId, 
        mockResearcherId, 
        questionOrders
      )).rejects.toThrow(ApiError);
    });
  });
});