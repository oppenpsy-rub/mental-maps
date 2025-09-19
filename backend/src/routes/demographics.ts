import { Router, Request, Response, NextFunction } from 'express';
import { DemographicDataService } from '../services/DemographicDataService';
import { authenticateToken } from '../middleware/auth';
import { participantAuth } from '../middleware/participantAuth';
import { ApiError, ValidationError } from '../types/errors';

const router = Router();
const demographicService = new DemographicDataService();

/**
 * Update demographic data for current participant session
 * POST /demographics/participant
 */
router.put('/participant', participantAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { demographicData } = req.body;
    
    if (!demographicData) {
      throw new ValidationError('Demographic data is required');
    }

    // Get participant from middleware
    const participant = (req as any).participant;
    
    const updatedParticipant = await demographicService.updateParticipantDemographicData(
      participant.id,
      demographicData
    );

    res.json({
      success: true,
      participant: {
        id: updatedParticipant.id,
        demographicData: updatedParticipant.demographicData
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get demographic statistics for a study (researcher only)
 * GET /demographics/studies/:studyId/statistics
 */
router.get('/studies/:studyId/statistics', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studyId } = req.params;
    const userId = (req as any).user.id;

    // TODO: Verify that the user owns this study
    // This should be implemented when study ownership is properly set up

    const statistics = await demographicService.getDemographicStatistics(studyId);

    res.json(statistics);
  } catch (error) {
    next(error);
  }
});

/**
 * Export demographic data for a study (researcher only)
 * GET /demographics/studies/:studyId/export
 */
router.get('/studies/:studyId/export', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studyId } = req.params;
    const { format = 'json' } = req.query;
    const userId = (req as any).user.id;

    // TODO: Verify that the user owns this study

    if (format !== 'json' && format !== 'csv') {
      throw new ValidationError('Format must be json or csv');
    }

    const exportData = await demographicService.exportDemographicData(studyId);

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'participantId',
        'studyId',
        'ageRange',
        'gender',
        'education',
        'occupation',
        'nativeLanguage',
        'otherLanguages',
        'birthPlace_city',
        'birthPlace_region',
        'birthPlace_country',
        'birthPlace_coordinates',
        'currentResidence_city',
        'currentResidence_region',
        'currentResidence_country',
        'currentResidence_coordinates',
        'dialectBackground',
        'languageExposure',
        'responseCount',
        'completionStatus',
        'startedAt',
        'completedAt'
      ];

      const csvRows = exportData.map(item => [
        item.participantId,
        item.studyId,
        item.demographicData.ageRange || '',
        item.demographicData.gender || '',
        item.demographicData.education || '',
        item.demographicData.occupation || '',
        item.demographicData.nativeLanguage || '',
        item.demographicData.otherLanguages?.join(';') || '',
        item.demographicData.birthPlace?.city || '',
        item.demographicData.birthPlace?.region || '',
        item.demographicData.birthPlace?.country || '',
        item.demographicData.birthPlace?.coordinates?.join(',') || '',
        item.demographicData.currentResidence?.city || '',
        item.demographicData.currentResidence?.region || '',
        item.demographicData.currentResidence?.country || '',
        item.demographicData.currentResidence?.coordinates?.join(',') || '',
        item.demographicData.dialectBackground || '',
        item.demographicData.languageExposure ? JSON.stringify(item.demographicData.languageExposure) : '',
        item.responseCount,
        item.completionStatus,
        item.startedAt.toISOString(),
        item.completedAt?.toISOString() || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="demographic_data_${studyId}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="demographic_data_${studyId}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Get linked demographic and response data for analysis (researcher only)
 * GET /demographics/studies/:studyId/linked-data
 */
router.get('/studies/:studyId/linked-data', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studyId } = req.params;
    const userId = (req as any).user.id;

    // TODO: Verify that the user owns this study

    const linkedData = await demographicService.linkDemographicDataToResponses(studyId);

    res.json({
      studyId,
      totalRecords: linkedData.length,
      data: linkedData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Validate demographic data format
 * POST /demographics/validate
 */
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { demographicData } = req.body;
    
    if (!demographicData) {
      throw new ValidationError('Demographic data is required');
    }

    const validation = demographicService.validateAndSanitizeDemographicData(demographicData);

    res.json({
      isValid: validation.isValid,
      errors: validation.errors,
      sanitizedData: validation.sanitizedData
    });
  } catch (error) {
    next(error);
  }
});

export default router;