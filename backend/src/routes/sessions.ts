import { Router } from 'express';
import { SessionManagementService } from '../services/SessionManagementService';
import { participantAuth } from '../middleware/participantAuth';
import { validateRequest, validateParams } from '../middleware/validation';
import {
    saveSessionSchema,
    participantIdParamSchema,
    studyIdParamSchema
} from '../validation/sessionValidation';
import { ApiError } from '../types/errors';

const router = Router();
const sessionService = new SessionManagementService();

/**
 * Save session data
 * POST /api/sessions/:participantId/save
 */
router.post(
    '/:participantId/save',
    participantAuth,
    validateParams(participantIdParamSchema),
    validateRequest(saveSessionSchema),
    async (req, res, next) => {
        try {
            const { participantId } = req.params;
            const { sessionData, incrementalUpdate = false } = req.body;

            // Verify participant ID matches
            if (sessionData.participantId !== participantId) {
                throw new ApiError('Participant ID mismatch', 400, 'PARTICIPANT_MISMATCH');
            }

            // Verify participant authorization
            if (req.participant?.participantId !== participantId) {
                throw new ApiError('Unauthorized', 403, 'UNAUTHORIZED');
            }

            await sessionService.saveSession({
                sessionData,
                incrementalUpdate
            });

            res.json({
                success: true,
                message: 'Session saved successfully',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            next(error);
        }
    }
);

/**
 * Load session data
 * GET /api/sessions/:participantId/load
 */
router.get(
    '/:participantId/load',
    participantAuth,
    validateParams(participantIdParamSchema),
    async (req, res, next) => {
        try {
            const { participantId } = req.params;

            // Verify participant authorization
            if (req.participant?.participantId !== participantId) {
                throw new ApiError('Unauthorized', 403, 'UNAUTHORIZED');
            }

            const sessionData = await sessionService.loadSession(participantId);

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
            next(error);
        }
    }
);

/**
 * Check session recovery
 * GET /api/sessions/:participantId/recovery
 */
router.get(
    '/:participantId/recovery',
    participantAuth,
    validateParams(participantIdParamSchema),
    async (req, res, next) => {
        try {
            const { participantId } = req.params;

            // Verify participant authorization
            if (req.participant?.participantId !== participantId) {
                throw new ApiError('Unauthorized', 403, 'UNAUTHORIZED');
            }

            const recoveryInfo = await sessionService.checkSessionRecovery(participantId);

            res.json({
                success: true,
                data: recoveryInfo
            });

        } catch (error) {
            next(error);
        }
    }
);

/**
 * Clear session data
 * DELETE /api/sessions/:participantId/clear
 */
router.delete(
    '/:participantId/clear',
    participantAuth,
    validateParams(participantIdParamSchema),
    async (req, res, next) => {
        try {
            const { participantId } = req.params;

            // Verify participant authorization
            if (req.participant?.participantId !== participantId) {
                throw new ApiError('Unauthorized', 403, 'UNAUTHORIZED');
            }

            await sessionService.clearSession(participantId);

            res.json({
                success: true,
                message: 'Session cleared successfully'
            });

        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get session statistics (for researchers)
 * GET /api/sessions/stats/:studyId
 */
router.get(
    '/stats/:studyId',
    // Note: This would need researcher authentication middleware
    validateParams(studyIdParamSchema),
    async (req, res, next) => {
        try {
            const { studyId } = req.params;

            const statistics = await sessionService.getSessionStatistics(studyId);

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
 * Heartbeat endpoint to keep session alive
 * POST /api/sessions/:participantId/heartbeat
 */
router.post(
    '/:participantId/heartbeat',
    participantAuth,
    validateParams(participantIdParamSchema),
    async (req, res, next) => {
        try {
            const { participantId } = req.params;

            // Verify participant authorization
            if (req.participant?.participantId !== participantId) {
                throw new ApiError('Unauthorized', 403, 'UNAUTHORIZED');
            }

            // Update last active time
            // This would be implemented in the participant repository
            // await participantRepository.updateLastActive(participantId);

            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                connectionStatus: 'active'
            });

        } catch (error) {
            next(error);
        }
    }
);

export default router;