import { Router, Request, Response } from 'express';
import { HeatmapService, HeatmapAnalysisResult } from '../services/HeatmapService.js';
import { ResponseCollectionService } from '../services/ResponseCollectionService.js';
import { HeatmapOptions, HeatmapPoint, AggregationMethod } from '../types/heatmap.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all analysis routes
router.use(auth);

// Analysis routes overview
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Analysis endpoints',
    endpoints: {
      'POST /heatmap': 'Generate heatmap',
      'POST /statistics': 'Calculate statistics',
      'POST /overlay': 'Create overlay analysis',
      'POST /clusters': 'Detect clusters',
      'POST /hotspots': 'Detect hotspots',
      'POST /responses': 'Get filtered responses',
      'POST /export': 'Export analysis results',
    },
  });
});

// Generate heatmap for study
router.post('/heatmap', async (req: Request, res: Response) => {
  try {
    const { studyId, options, filters } = req.body;

    if (!studyId) {
      return res.status(400).json({ error: 'Study ID is required' });
    }

    const responseService = new ResponseCollectionService();
    const responses = await responseService.getMentalMapsByStudy(studyId);

    if (responses.length === 0) {
      return res.json({
        points: [],
        radius: options?.radius || 20,
        maxIntensity: 1,
        gradient: {
          0.0: 'rgba(0, 0, 255, 0)',
          0.2: 'rgba(0, 0, 255, 0.5)',
          0.4: 'rgba(0, 255, 255, 0.7)',
          0.6: 'rgba(0, 255, 0, 0.8)',
          0.8: 'rgba(255, 255, 0, 0.9)',
          1.0: 'rgba(255, 0, 0, 1.0)'
        },
        blur: options?.blur || 15
      });
    }

    // Convert responses to heatmap points
    const points: HeatmapPoint[] = [];
    responses.forEach(response => {
      if (response.mapDrawing?.elements) {
        response.mapDrawing.elements.forEach((element: any) => {
          if (element.geometry?.type === 'Point') {
            const [lng, lat] = element.geometry.coordinates;
            points.push({
              lat,
              lng,
              intensity: Math.random() * 0.8 + 0.2, // Mock intensity
              metadata: {
                participantCode: response.participantCode,
                responseId: response.responseId,
                elementType: element.type
              }
            });
          }
        });
      }
    });

    const heatmapOptions: HeatmapOptions = {
      radius: options?.radius || 20,
      blur: options?.blur || 15,
      aggregationMethod: options?.aggregationMethod || AggregationMethod.DENSITY,
      gridSize: options?.gridSize || 10,
      ...options
    };

    const heatmapData = HeatmapService.generateHeatmap(points, heatmapOptions);
    res.json(heatmapData);

  } catch (error) {
    console.error('Error generating heatmap:', error);
    res.status(500).json({ error: 'Failed to generate heatmap' });
  }
});

// Calculate study statistics
router.post('/statistics', async (req: Request, res: Response) => {
  try {
    const { studyId, filters } = req.body;

    if (!studyId) {
      return res.status(400).json({ error: 'Study ID is required' });
    }

    const responseService = new ResponseCollectionService();
    const responses = await responseService.getMentalMapsByStudy(studyId);
    const statistics = await responseService.getResponseStatistics(studyId);

    // Enhanced statistics
    const enhancedStats = {
      ...statistics,
      completionRate: 85, // Mock completion rate
      responsesByDay: [], // Mock daily response data
      responsesByQuestion: responses.reduce((acc: any, response) => {
        const questionId = response.questionId;
        acc[questionId] = (acc[questionId] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(enhancedStats);

  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

// Detect clusters in study data
router.post('/clusters', async (req: Request, res: Response) => {
  try {
    const { studyId, clusterRadius = 50, filters } = req.body;

    if (!studyId) {
      return res.status(400).json({ error: 'Study ID is required' });
    }

    const responseService = new ResponseCollectionService();
    const responses = await responseService.getMentalMapsByStudy(studyId);

    // Convert responses to heatmap points
    const points: HeatmapPoint[] = [];
    responses.forEach(response => {
      if (response.mapDrawing?.elements) {
        response.mapDrawing.elements.forEach((element: any) => {
          if (element.geometry?.type === 'Point') {
            const [lng, lat] = element.geometry.coordinates;
            points.push({
              lat,
              lng,
              intensity: Math.random() * 0.8 + 0.2,
              metadata: {
                participantCode: response.participantCode,
                responseId: response.responseId
              }
            });
          }
        });
      }
    });

    const heatmapOptions: HeatmapOptions = {
      enableClustering: true,
      clusterRadius
    };

    const analysisResult = HeatmapService.analyzeHeatmap(points, heatmapOptions);
    res.json(analysisResult.clusters || []);

  } catch (error) {
    console.error('Error detecting clusters:', error);
    res.status(500).json({ error: 'Failed to detect clusters' });
  }
});

// Detect hotspots in study data
router.post('/hotspots', async (req: Request, res: Response) => {
  try {
    const { studyId, options = {}, filters } = req.body;

    if (!studyId) {
      return res.status(400).json({ error: 'Study ID is required' });
    }

    const responseService = new ResponseCollectionService();
    const responses = await responseService.getMentalMapsByStudy(studyId);

    // Convert responses to heatmap points
    const points: HeatmapPoint[] = [];
    responses.forEach(response => {
      if (response.mapDrawing?.elements) {
        response.mapDrawing.elements.forEach((element: any) => {
          if (element.geometry?.type === 'Point') {
            const [lng, lat] = element.geometry.coordinates;
            points.push({
              lat,
              lng,
              intensity: Math.random() * 0.8 + 0.2,
              metadata: {
                participantCode: response.participantCode,
                responseId: response.responseId
              }
            });
          }
        });
      }
    });

    const heatmapOptions: HeatmapOptions = {
      hotspotThreshold: options.threshold || 0.7,
      hotspotRadius: options.radius || 50,
      minHotspotPoints: options.minPoints || 2
    };

    const analysisResult = HeatmapService.analyzeHeatmap(points, heatmapOptions);
    res.json(analysisResult.statistics.hotspots || []);

  } catch (error) {
    console.error('Error detecting hotspots:', error);
    res.status(500).json({ error: 'Failed to detect hotspots' });
  }
});

// Create overlay analysis
router.post('/overlay', async (req: Request, res: Response) => {
  try {
    const { studyId, responseIds, name } = req.body;

    if (!studyId || !responseIds || !Array.isArray(responseIds)) {
      return res.status(400).json({ error: 'Study ID and response IDs are required' });
    }

    const responseService = new ResponseCollectionService();
    const allResponses = await responseService.getMentalMapsByStudy(studyId);
    
    // Filter responses by provided IDs
    const selectedResponses = allResponses.filter(response => 
      responseIds.includes(response.responseId)
    );

    // Generate combined heatmap
    const points: HeatmapPoint[] = [];
    selectedResponses.forEach(response => {
      if (response.mapDrawing?.elements) {
        response.mapDrawing.elements.forEach((element: any) => {
          if (element.geometry?.type === 'Point') {
            const [lng, lat] = element.geometry.coordinates;
            points.push({
              lat,
              lng,
              intensity: Math.random() * 0.8 + 0.2,
              metadata: {
                participantCode: response.participantCode,
                responseId: response.responseId
              }
            });
          }
        });
      }
    });

    const heatmapOptions: HeatmapOptions = {
      radius: 20,
      blur: 15,
      aggregationMethod: AggregationMethod.AVERAGE
    };

    const combinedHeatmap = HeatmapService.generateHeatmap(points, heatmapOptions);
    const analysisResult = HeatmapService.analyzeHeatmap(points, heatmapOptions);

    const overlayAnalysis = {
      id: `overlay_${Date.now()}`,
      name: name || `Overlay Analysis ${responseIds.length} responses`,
      responseIds,
      combinedHeatmap,
      statistics: {
        totalResponses: selectedResponses.length,
        totalParticipants: new Set(selectedResponses.map(r => r.participantCode)).size,
        averageResponseTime: selectedResponses.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / selectedResponses.length,
        averageElementsPerResponse: selectedResponses.reduce((sum, r) => sum + (r.mapDrawing?.elements?.length || 0), 0) / selectedResponses.length,
        completionRate: 100,
        responsesByQuestion: {},
        responsesByDay: []
      },
      clusters: analysisResult.clusters,
      hotspots: analysisResult.statistics.hotspots
    };

    res.json(overlayAnalysis);

  } catch (error) {
    console.error('Error creating overlay analysis:', error);
    res.status(500).json({ error: 'Failed to create overlay analysis' });
  }
});

// Get filtered responses for analysis
router.post('/responses', async (req: Request, res: Response) => {
  try {
    const { studyId, filters } = req.body;

    if (!studyId) {
      return res.status(400).json({ error: 'Study ID is required' });
    }

    const responseService = new ResponseCollectionService();
    let responses = await responseService.getMentalMapsByStudy(studyId);

    // Apply filters if provided
    if (filters) {
      if (filters.participantIds && filters.participantIds.length > 0) {
        responses = responses.filter(r => filters.participantIds.includes(r.participantId));
      }
      
      if (filters.questionIds && filters.questionIds.length > 0) {
        responses = responses.filter(r => filters.questionIds.includes(r.questionId));
      }
      
      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        responses = responses.filter(r => {
          const responseDate = new Date(r.responseCreatedAt);
          return responseDate >= startDate && responseDate <= endDate;
        });
      }
      
      if (filters.responseTimeRange) {
        responses = responses.filter(r => 
          r.responseTimeMs >= filters.responseTimeRange.min && 
          r.responseTimeMs <= filters.responseTimeRange.max
        );
      }
    }

    res.json(responses);

  } catch (error) {
    console.error('Error getting filtered responses:', error);
    res.status(500).json({ error: 'Failed to get filtered responses' });
  }
});

// Export analysis results
router.post('/export', async (req: Request, res: Response) => {
  try {
    const { studyId, analysisType, options } = req.body;

    if (!studyId || !analysisType) {
      return res.status(400).json({ error: 'Study ID and analysis type are required' });
    }

    const responseService = new ResponseCollectionService();
    const responses = await responseService.getMentalMapsByStudy(studyId);

    let exportData: any;

    switch (analysisType) {
      case 'heatmap':
        // Export heatmap data
        exportData = {
          studyId,
          analysisType: 'heatmap',
          timestamp: new Date().toISOString(),
          data: responses,
          options
        };
        break;
      
      case 'statistics':
        // Export statistics
        const statistics = await responseService.getResponseStatistics(studyId);
        exportData = {
          studyId,
          analysisType: 'statistics',
          timestamp: new Date().toISOString(),
          data: statistics,
          options
        };
        break;
      
      default:
        exportData = {
          studyId,
          analysisType,
          timestamp: new Date().toISOString(),
          data: responses,
          options
        };
    }

    if (options.format === 'csv') {
      // Convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analysis_${studyId}_${analysisType}.csv"`);
      
      // Simple CSV conversion
      const csvData = responses.map(r => ({
        participant_code: r.participantCode,
        question_title: r.questionTitle,
        response_time_ms: r.responseTimeMs,
        elements_count: r.mapDrawing?.elements?.length || 0,
        created_at: r.responseCreatedAt
      }));
      
      const csvHeaders = Object.keys(csvData[0] || {}).join(',');
      const csvRows = csvData.map(row => Object.values(row).join(','));
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.send(csvContent);
    } else {
      // JSON export
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analysis_${studyId}_${analysisType}.json"`);
      res.json(exportData);
    }

  } catch (error) {
    console.error('Error exporting analysis:', error);
    res.status(500).json({ error: 'Failed to export analysis' });
  }
});

export { router as analysisRoutes };