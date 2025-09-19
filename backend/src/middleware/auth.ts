import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/AuthService';
import { ResearcherRepository } from '../repositories/ResearcherRepository';
import { AuthenticationError, AuthorizationError } from '../types/errors';
import { Researcher } from '../models/Researcher';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      researcher?: Researcher;
      tokenPayload?: TokenPayload;
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;
  private researcherRepository: ResearcherRepository;

  constructor() {
    this.authService = new AuthService();
    this.researcherRepository = new ResearcherRepository();
  }

  /**
   * Middleware to authenticate JWT tokens for researchers
   */
  authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = this.authService.extractTokenFromHeader(authHeader);

      if (!token) {
        throw new AuthenticationError('Access token required');
      }

      // Validate token
      const payload = this.authService.validateToken(token);
      
      if (payload.type !== 'access') {
        throw new AuthenticationError('Invalid token type');
      }

      // Find researcher
      const researcher = await this.researcherRepository.findById(payload.researcherId);
      if (!researcher) {
        throw new AuthenticationError('Researcher not found');
      }

      // Attach to request
      req.researcher = researcher;
      req.tokenPayload = payload;

      next();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Optional authentication middleware - doesn't throw if no token provided
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = this.authService.extractTokenFromHeader(authHeader);

      if (token) {
        const payload = this.authService.validateToken(token);
        
        if (payload.type === 'access') {
          const researcher = await this.researcherRepository.findById(payload.researcherId);
          if (researcher) {
            req.researcher = researcher;
            req.tokenPayload = payload;
          }
        }
      }

      next();
    } catch (error) {
      // For optional auth, we don't throw errors, just continue without auth
      next();
    }
  };

  /**
   * Middleware to check if the authenticated researcher owns a specific study
   */
  requireStudyOwnership = (studyIdParam: string = 'studyId') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.researcher) {
          throw new AuthenticationError('Authentication required');
        }

        const studyId = req.params[studyIdParam];
        if (!studyId) {
          throw new AuthorizationError('Study ID required');
        }

        // Check if researcher owns the study
        const studyRepository = new (await import('../repositories/StudyRepository')).StudyRepository();
        const study = await studyRepository.findById(studyId);
        
        if (!study) {
          throw new AuthorizationError('Study not found');
        }

        if (study.researcherId !== req.researcher.id) {
          throw new AuthorizationError('Access denied: You do not own this study');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };

  /**
   * Middleware to validate refresh tokens
   */
  validateRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AuthenticationError('Refresh token required');
      }

      const payload = this.authService.validateToken(refreshToken);
      
      if (payload.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      req.tokenPayload = payload;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export middleware functions
export const authenticateToken = authMiddleware.authenticateToken;
export const optionalAuth = authMiddleware.optionalAuth;
export const requireStudyOwnership = authMiddleware.requireStudyOwnership;
export const validateRefreshToken = authMiddleware.validateRefreshToken;