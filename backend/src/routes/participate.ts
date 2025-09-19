import { Router } from 'express';
import { z } from 'zod';
import { StudyService } from '../services/StudyService';
import { SessionManagementService } from '../services/SessionManagementService';
import { ResponseCollectionService } from '../services/ResponseCollectionService';
import { DemographicDataService } from '../services/DemographicDataService';
import { participantAuth } from '../middleware/participantAuth';

const router = Router();
const studyService = new StudyService();
const sessionService = new SessionManagementService();
const responseService = new ResponseCollectionService();
const demographicService = new DemographicDataService();

// Validation schemas
const startParticipationSchema = z.object({
  consentGiven: z.boolean(),
  metadata: z.object({
    userAgent: z.string().optional(),
    screenResolution: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    timestamp: z.number()
  }).optional()
});

const submitResponseSchema = z.object({
  questionId: z.string(),
  responseData: z.any(),
  mapDrawing: z.any().optional(),
  responseTimeMs: z.number().optional()
});

const submitDemographicSchema = z.object({
  demographicData: z.any(),
  timestamp: z.number()
});

const completeParticipationSchema = z.object({
  completedAt: z.number()
});

const saveSessionSchema = z.object({
  sessionData: z.any(),
  timestamp: z.number()
});

/**
 * GET /api/participate/:studyId/info
 * Get study information for participation
 */
router.get('/:studyId/info', async (req, res) => {
  try {
    const { studyId } = req.params;

    // Get study information
    const study = await studyService.getStudyById(studyId, true);
    
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    if (!study.active) {
      return res.status(403).json({
        success: false,
        message: 'Study is not active'
      });
    }

    // Get questions for the study (bypass researcher permission check for participation)
    const questions = await studyService.getStudyQuestionsForParticipation(studyId);

    // Calculate estimated duration (rough estimate: 2-3 minutes per question)
    const estimatedDuration = questions.length * 2.5;

    res.json({
      success: true,
      data: {
        study,
        questions,
        canParticipate: true,
        requiresConsent: true,
        estimatedDuration
      }
    });
  } catch (error) {
    console.error('Error getting study info for participation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/participate/:studyId/start
 * Start participation in a study
 */
router.post('/:studyId/start', async (req, res) => {
  try {
    const { studyId } = req.params;
    const validatedData = startParticipationSchema.parse(req.body);

    // Verify study exists and is active
    const study = await studyService.getStudyById(studyId);
    
    if (!study) {
      return res.status(404).json({
        success: false,
        message: 'Study not found'
      });
    }

    if (!study.active) {
      return res.status(403).json({
        success: false,
        message: 'Study is not active'
      });
    }

    if (!validatedData.consentGiven) {
      return res.status(400).json({
        success: false,
        message: 'Consent is required to participate'
      });
    }

    // Generate session token
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Set session expiry (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create session in database and get the generated participant ID
    const participantId = await sessionService.createSession({
      studyId,
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      metadata: validatedData.metadata || {},
      consentGiven: validatedData.consentGiven,
      startedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        participantId,
        studyId,
        sessionToken,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error starting participation:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/participate/responses
 * Submit a response to a question
 */
router.post('/responses', participantAuth, async (req, res) => {
  try {
    const validatedData = submitResponseSchema.parse(req.body);
    const { participantId, studyId } = req.participant!;

    // Submit the response
    await responseService.submitResponse({
      participantId,
      questionId: validatedData.questionId,
      responseData: validatedData.responseData,
      mapDrawing: validatedData.mapDrawing,
      responseTimeMs: validatedData.responseTimeMs || 0
    });

    res.json({
      success: true,
      message: 'Response submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/participate/demographics
 * Submit demographic data
 */
router.post('/demographics', participantAuth, async (req, res) => {
  try {
    const validatedData = submitDemographicSchema.parse(req.body);
    const { participantId, studyId } = req.participant!;

    // Submit demographic data
    await demographicService.updateParticipantDemographicData(
      participantId,
      validatedData.demographicData
    );

    res.json({
      success: true,
      message: 'Demographic data submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting demographic data:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/participate/complete
 * Complete participation in a study
 */
router.post('/complete', participantAuth, async (req, res) => {
  try {
    const validatedData = completeParticipationSchema.parse(req.body);
    const { participantId, studyId } = req.participant!;

    // Mark session as completed
    await sessionService.completeSession(participantId, {
      completedAt: new Date(validatedData.completedAt).toISOString()
    });

    res.json({
      success: true,
      message: 'Participation completed successfully'
    });
  } catch (error) {
    console.error('Error completing participation:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/participate/validate
 * Validate participant session
 */
router.post('/validate', participantAuth, async (req, res) => {
  try {
    const { participantId, studyId, sessionToken, expiresAt } = req.participant!;

    res.json({
      success: true,
      data: {
        isValid: true,
        participantId,
        studyId,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Error validating session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/participate/progress
 * Get participant's current progress
 */
router.get('/progress', participantAuth, async (req, res) => {
  try {
    const { participantId, studyId } = req.participant!;

    // Get session data
    const sessionData = await sessionService.getSessionData(participantId);
    
    // Get study questions to calculate progress
    const questions = await studyService.getStudyQuestions(studyId, 'system');
    
    // Get submitted responses (using empty array as fallback)
    const responses: any[] = [];

    res.json({
      success: true,
      data: {
        currentQuestionIndex: sessionData?.currentQuestionIndex || 0,
        completedQuestions: responses.length,
        totalQuestions: questions.length,
        responses: responses.reduce((acc, response) => {
          acc[response.questionId] = response;
          return acc;
        }, {} as Record<string, any>)
      }
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/participate/session/save
 * Save session data
 */
router.post('/session/save', participantAuth, async (req, res) => {
  try {
    const validatedData = saveSessionSchema.parse(req.body);
    const { participantId } = req.participant!;

    await sessionService.saveSessionData(participantId, validatedData.sessionData);

    res.json({
      success: true,
      message: 'Session data saved successfully'
    });
  } catch (error) {
    console.error('Error saving session data:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/participate/session/load
 * Load session data
 */
router.get('/session/load', participantAuth, async (req, res) => {
  try {
    const { participantId } = req.participant!;

    const sessionData = await sessionService.getSessionData(participantId);

    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: 'No session data found'
      });
    }

    res.json({
      success: true,
      data: sessionData
    });
  } catch (error) {
    console.error('Error loading session data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/participate/heartbeat
 * Send heartbeat to keep session alive
 */
router.post('/heartbeat', participantAuth, async (req, res) => {
  try {
    const { participantId } = req.participant!;

    await sessionService.updateSessionHeartbeat(participantId);

    res.json({
      success: true,
      message: 'Heartbeat received'
    });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;