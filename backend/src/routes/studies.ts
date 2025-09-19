import { Router, Request, Response, NextFunction } from 'express';
import { StudyService } from '../services/StudyService';
import { authenticateToken, requireStudyOwnership } from '../middleware/auth';
import { validateRequest, validateQuery } from '../middleware/validation';
import {
  createStudySchema,
  updateStudySchema,
  createQuestionSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
  studyQuerySchema
} from '../validation';
const router = Router();
const studyService = new StudyService();



/**
 * GET /studies
 * List all studies for the authenticated researcher
 */
router.get('/', 
  authenticateToken,
  validateQuery(studyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const researcherId = req.researcher!.id;
      const options = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string,
        active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      const result = await studyService.getStudiesForResearcher(researcherId, options);
      
      res.json({
        success: true,
        data: result.studies,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /studies
 * Create a new study
 */
router.post('/',
  authenticateToken,
  validateRequest(createStudySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const researcherId = req.researcher!.id;
      const study = await studyService.createStudy(researcherId, req.body);
      
      res.status(201).json({
        success: true,
        data: study,
        message: 'Study created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /studies/:id
 * Get study details
 */
router.get('/:id',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const includeQuestions = req.query.include === 'questions';
      
      const study = await studyService.getStudyById(studyId, includeQuestions);
      
      res.json({
        success: true,
        data: study
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /studies/:id
 * Update study
 */
router.put('/:id',
  authenticateToken,
  requireStudyOwnership('id'),
  validateRequest(updateStudySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const researcherId = req.researcher!.id;
      
      const study = await studyService.updateStudy(studyId, researcherId, req.body);
      
      res.json({
        success: true,
        data: study,
        message: 'Study updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /studies/:id
 * Delete study
 */
router.delete('/:id',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const researcherId = req.researcher!.id;
      
      await studyService.deleteStudy(studyId, researcherId);
      
      res.json({
        success: true,
        message: 'Study deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /studies/:id/activate
 * Activate study
 */
router.post('/:id/activate',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const researcherId = req.researcher!.id;
      const { reason } = req.body;
      
      const study = await studyService.activateStudy(studyId, researcherId, reason);
      
      res.json({
        success: true,
        data: study,
        message: 'Study activated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /studies/:id/deactivate
 * Deactivate study (pause)
 */
router.post('/:id/deactivate',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const researcherId = req.researcher!.id;
      const { reason } = req.body;
      
      const study = await studyService.deactivateStudy(studyId, researcherId, reason);
      
      res.json({
        success: true,
        data: study,
        message: 'Study deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /studies/:id/status
 * Change study status
 */
router.put('/:id/status',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const researcherId = req.researcher!.id;
      const { status, reason } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }
      
      const study = await studyService.changeStudyStatus(studyId, researcherId, status, reason);
      
      res.json({
        success: true,
        data: study,
        message: `Study status changed to ${status} successfully`
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /studies/:id/status
 * Get study status information
 */
router.get('/:id/status',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const researcherId = req.researcher!.id;
      
      const statusInfo = await studyService.getStudyStatus(studyId, researcherId);
      
      res.json({
        success: true,
        data: statusInfo
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /studies/:id/statistics
 * Get study statistics
 */
router.get('/:id/statistics',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const researcherId = req.researcher!.id;
      
      const statistics = await studyService.getStudyStatistics(studyId, researcherId);
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /studies/:id/questions
 * Get study questions
 */
router.get('/:id/questions',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const researcherId = req.researcher!.id;
      
      const questions = await studyService.getStudyQuestions(studyId, researcherId);
      
      res.json({
        success: true,
        data: questions
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /studies/:id/questions
 * Add question to study
 */
router.post('/:id/questions',
  authenticateToken,
  requireStudyOwnership('id'),
  validateRequest(createQuestionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const researcherId = req.researcher!.id;
      
      const question = await studyService.addQuestion(studyId, researcherId, req.body);
      
      res.status(201).json({
        success: true,
        data: question,
        message: 'Question added successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /studies/:id/questions/:questionId
 * Update question
 */
router.put('/:id/questions/:questionId',
  authenticateToken,
  requireStudyOwnership('id'),
  validateRequest(updateQuestionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const questionId = req.params.questionId;
      const researcherId = req.researcher!.id;
      
      const question = await studyService.updateQuestion(studyId, questionId, researcherId, req.body);
      
      res.json({
        success: true,
        data: question,
        message: 'Question updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /studies/:id/questions/:questionId
 * Delete question
 */
router.delete('/:id/questions/:questionId',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const questionId = req.params.questionId;
      const researcherId = req.researcher!.id;
      
      await studyService.deleteQuestion(studyId, questionId, researcherId);
      
      res.json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /studies/:id/questions/reorder
 * Reorder multiple questions
 */
router.put('/:id/questions/reorder',
  authenticateToken,
  requireStudyOwnership('id'),
  validateRequest(reorderQuestionsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const researcherId = req.researcher!.id;
      
      const questions = await studyService.reorderQuestions(studyId, researcherId, req.body.questionOrders);
      
      res.json({
        success: true,
        data: questions,
        message: 'Questions reordered successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /studies/:id/questions/by-type/:type
 * Get questions by type
 */
router.get('/:id/questions/by-type/:type',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const questionType = req.params.type;
      const researcherId = req.researcher!.id;
      
      const questions = await studyService.getQuestionsByType(studyId, researcherId, questionType);
      
      res.json({
        success: true,
        data: questions
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /studies/:id/questions/:questionId/duplicate
 * Duplicate a question
 */
router.post('/:id/questions/:questionId/duplicate',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const questionId = req.params.questionId;
      const researcherId = req.researcher!.id;
      
      const question = await studyService.duplicateQuestion(studyId, questionId, researcherId);
      
      res.status(201).json({
        success: true,
        data: question,
        message: 'Question duplicated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /studies/:id/questions/:questionId/validate
 * Validate question configuration
 */
router.get('/:id/questions/:questionId/validate',
  authenticateToken,
  requireStudyOwnership('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studyId = req.params.id;
      const questionId = req.params.questionId;
      const researcherId = req.researcher!.id;
      
      const validation = await studyService.validateQuestion(studyId, questionId, researcherId);
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as studyRoutes };