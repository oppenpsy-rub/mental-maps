import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { ParticipantSessionService } from '../services/ParticipantSessionService';
import { DemographicDataService } from '../services/DemographicDataService';
import { ResearcherRepository } from '../repositories/ResearcherRepository';
import { authenticateToken, validateRefreshToken } from '../middleware/auth';
import { participantAuth } from '../middleware/participantAuth';
import { validateRequest, loginSchema, refreshTokenSchema, registerSchema, participantSessionSchema } from '../validation/authValidation';
import { ApiError, ValidationError } from '../types/errors';

const router = Router();
const authService = new AuthService();
const participantSessionService = new ParticipantSessionService();
const demographicDataService = new DemographicDataService();
const researcherRepository = new ResearcherRepository();

// Authentication routes overview
router.get('/', (req, res) => {
  res.json({
    message: 'Authentication endpoints',
    endpoints: {
      'POST /login': 'Researcher login',
      'POST /logout': 'Researcher logout',
      'POST /refresh': 'Refresh JWT token',
      'POST /register': 'Register new researcher',
      'POST /participant-session': 'Create participant session',
      'GET /me': 'Get current user info',
    },
  });
});

// Researcher login
router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    const authResult = await authService.authenticateResearcher({ email, password });
    
    res.json({
      message: 'Login successful',
      researcher: authResult.researcher,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken
    });
  } catch (error) {
    next(error);
  }
});

// Researcher registration
router.post('/register', validateRequest(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, institution } = req.body;
    
    // Check if email already exists
    const emailExists = await researcherRepository.emailExists(email);
    if (emailExists) {
      throw ApiError.conflict('Email already registered');
    }
    
    // Hash password
    const passwordHash = await authService.hashPassword(password);
    
    // Create researcher
    const researcher = await researcherRepository.create({
      email,
      passwordHash,
      name,
      institution
    });
    
    // Generate tokens
    const accessToken = authService.generateAccessToken(researcher);
    const refreshToken = authService.generateRefreshToken(researcher);
    
    res.status(201).json({
      message: 'Registration successful',
      researcher,
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

// Researcher logout (client-side token removal)
router.post('/logout', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a JWT-based system, logout is typically handled client-side by removing the token
    // For enhanced security, you could maintain a blacklist of tokens in Redis
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

// Refresh JWT token
router.post('/refresh', validateRequest(refreshTokenSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    const authResult = await authService.refreshToken(refreshToken);
    
    res.json({
      message: 'Token refreshed successfully',
      researcher: authResult.researcher,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken
    });
  } catch (error) {
    next(error);
  }
});

// Get current authenticated researcher info
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.researcher) {
      throw ApiError.unauthorized('Authentication required');
    }
    
    // Get researcher with studies
    const researcher = await researcherRepository.findWithStudies(req.researcher.id);
    
    res.json({
      researcher,
      tokenInfo: {
        researcherId: req.tokenPayload?.researcherId,
        email: req.tokenPayload?.email,
        type: req.tokenPayload?.type
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create participant session for study participation
router.post('/participant-session', validateRequest(participantSessionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studyId, demographicData } = req.body;
    
    const sessionResult = await participantSessionService.createParticipantSession({
      studyId,
      demographicData
    });
    
    res.status(201).json({
      message: 'Participant session created successfully',
      sessionToken: sessionResult.sessionToken,
      participant: {
        id: sessionResult.participant.id,
        studyId: sessionResult.participant.studyId,
        startedAt: sessionResult.participant.startedAt
      },
      study: {
        id: sessionResult.study.id,
        title: sessionResult.study.title,
        description: sessionResult.study.description
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get participant session info
router.get('/participant-session', participantAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.participant) {
      throw ApiError.unauthorized('Session token required');
    }
    
    const sessionInfo = await participantSessionService.getSessionInfo(req.participant.sessionToken);
    
    res.json({
      message: 'Session info retrieved successfully',
      ...sessionInfo
    });
  } catch (error) {
    next(error);
  }
});

// Update participant demographic data
router.patch('/participant-session/demographics', participantAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.participant) {
      throw ApiError.unauthorized('Session token required');
    }
    
    // Use the new demographic service for validation and sanitization
    const updatedParticipant = await demographicDataService.updateParticipantDemographicData(
      req.participant.participantId,
      req.body.demographicData || req.body
    );
    
    res.json({
      message: 'Demographic data updated successfully',
      participant: {
        id: updatedParticipant.id,
        demographicData: updatedParticipant.demographicData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Complete participant session
router.post('/participant-session/complete', participantAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.participant) {
      throw ApiError.unauthorized('Session token required');
    }
    
    await participantSessionService.completeSession(req.participant.sessionToken);
    
    res.json({
      message: 'Session completed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };