import { Router, Request, Response } from 'express';
import { ResponseCollectionService } from '../services/ResponseCollectionService';
import { participantAuth } from '../middleware/participantAuth';
import { authenticateToken as auth } from '../middleware/auth';
import { 
  validateSubmitResponse, 
  validateUpdateResponse, 
  validateResponseFilters,
  validateExportFormat 
} from '../validation/responseValidation';
import { ApiError } from '../types/errors';

const router = Router();
const responseService = new ResponseCollectionService();

// Response collection routes
router.get('/', (req, res) => {
  res.json({
    message: 'Response collection endpoints',
    endpoints: {
      'POST /': 'Submit participant response',
      'GET /study/:studyId': 'Get responses for study',
      'GET /study/:studyId/mental-maps': 'Get mental maps for study',
      'GET /:id': 'Get specific response',
      'PUT /:id': 'Update response',
      'DELETE /:id': 'Delete response',
      'POST /study/:studyId/export': 'Export study responses',
      'GET /study/:studyId/statistics': 'Get response statistics',
    },
  });
});

// Submit new response (participant endpoint)
router.post('/', participantAuth, validateSubmitResponse, async (req: Request, res: Response) => {
  try {
    const response = await responseService.submitResponse(req.body);
    res.status(201).json({
      success: true,
      data: response,
      message: 'Response submitted successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        type: error.type,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Failed to submit response'
      });
    }
  }
});

// Get mental maps for a study (researcher endpoint)
router.get('/study/:studyId/mental-maps', auth, async (req: Request, res: Response) => {
  try {
    const { studyId } = req.params;
    const mentalMaps = await responseService.getMentalMapsByStudy(studyId);
    
    res.json({
      success: true,
      data: mentalMaps,
      count: mentalMaps.length,
      message: 'Mental maps retrieved successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        type: error.type,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve mental maps'
      });
    }
  }
});

// Get responses for a study (researcher endpoint)
router.get('/study/:studyId', auth, validateResponseFilters, async (req: Request, res: Response) => {
  try {
    const { studyId } = req.params;
    const filters = req.query;
    
    const responses = await responseService.getResponsesByStudy(studyId, filters as any);
    
    res.json({
      success: true,
      data: responses,
      count: responses.length,
      message: 'Responses retrieved successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        type: error.type,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve responses'
      });
    }
  }
});

// Get specific response
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await responseService.getResponse(id);
    
    res.json({
      success: true,
      data: response,
      message: 'Response retrieved successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        type: error.type,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve response'
      });
    }
  }
});

// Update response (participant endpoint)
router.put('/:id', participantAuth, validateUpdateResponse, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await responseService.updateResponse(id, req.body);
    
    res.json({
      success: true,
      data: response,
      message: 'Response updated successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        type: error.type,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Failed to update response'
      });
    }
  }
});

// Delete response (researcher endpoint)
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await responseService.deleteResponse(id);
    
    res.json({
      success: true,
      message: 'Response deleted successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        type: error.type,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Failed to delete response'
      });
    }
  }
});

// Export study responses (researcher endpoint)
router.post('/study/:studyId/export', auth, validateExportFormat, async (req: Request, res: Response) => {
  try {
    const { studyId } = req.params;
    const { format } = req.body;
    
    const exportData = await responseService.exportResponses(studyId, format);
    
    const filename = `study-${studyId}-responses.${format}`;
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    res.json({
      success: true,
      data: exportData,
      filename,
      message: 'Export completed successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        type: error.type,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Failed to export responses'
      });
    }
  }
});

// Get response statistics for a study (researcher endpoint)
router.get('/study/:studyId/statistics', auth, async (req: Request, res: Response) => {
  try {
    const { studyId } = req.params;
    const statistics = await responseService.getResponseStatistics(studyId);
    
    res.json({
      success: true,
      data: statistics,
      message: 'Statistics retrieved successfully'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        type: error.type,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        type: 'INTERNAL_ERROR',
        message: 'Failed to retrieve statistics'
      });
    }
  }
});

export { router as responseRoutes };