import { Request, Response, NextFunction } from 'express';
import { SessionManagementService } from '../services/SessionManagementService';

// Extend Express Request interface to include participant session data
declare global {
  namespace Express {
    interface Request {
      participant?: {
        participantId: string;
        studyId: string;
        sessionToken: string;
        expiresAt: string;
      };
    }
  }
}

const sessionService = new SessionManagementService();

/**
 * Middleware to authenticate participant session tokens
 */
export const participantAuth = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Participant session token required'
      });
    }

    const sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate session token
    const session = await sessionService.validateSessionToken(sessionToken);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token'
      });
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Session has expired'
      });
    }

    // Attach participant info to request
    req.participant = {
      participantId: session.participantId,
      studyId: session.studyId,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt
    };

    next();
  } catch (error) {
    console.error('Participant auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};