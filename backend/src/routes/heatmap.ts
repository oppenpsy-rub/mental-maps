import { Router } from 'express';
import { HeatmapService, HeatmapAnalysisResult } from '../services/HeatmapService.js';
import { HeatmapAnalysisRequest, HeatmapExportOptions, HeatmapPoint } from '../types/heatmap.js';
import { authenticateToken } from '../middleware/auth';
import { validateRequest, validateParams, validateQuery } from '../middleware/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const heatmapAnalysisSchema = Joi.object({
    studyId: Joi.string().uuid().required().messages({
        'string.guid': 'Study ID must be a valid UUID'
    }),
    questionId: Joi.string().uuid().optional().messages({
        'string.guid': 'Question ID must be a valid UUID'
    }),
    options: Joi.object({
        radius: Joi.number().integer().min(1).max(200).optional().messages({
            'number.min': 'Radius must be between 1 and 200',
            'number.max': 'Radius must be between 1 and 200'
        }),
        blur: Joi.number().min(0).max(50).optional().messages({
            'number.min': 'Blur must be between 0 and 50',
            'number.max': 'Blur must be between 0 and 50'
        }),
        aggregationMethod: Joi.string().valid('none', 'density', 'average', 'sum', 'max').optional().messages({
            'any.only': 'Invalid aggregation method'
        }),
        gridSize: Joi.number().integer().min(1).max(100).optional().messages({
            'number.min': 'Grid size must be between 1 and 100',
            'number.max': 'Grid size must be between 1 and 100'
        }),
        hotspotThreshold: Joi.number().min(0).max(1).optional().messages({
            'number.min': 'Hotspot threshold must be between 0 and 1',
            'number.max': 'Hotspot threshold must be between 0 and 1'
        }),
        hotspotRadius: Joi.number().integer().min(1).max(500).optional().messages({
            'number.min': 'Hotspot radius must be between 1 and 500',
            'number.max': 'Hotspot radius must be between 1 and 500'
        }),
        minHotspotPoints: Joi.number().integer().min(1).max(100).optional().messages({
            'number.min': 'Min hotspot points must be between 1 and 100',
            'number.max': 'Min hotspot points must be between 1 and 100'
        }),
        enableClustering: Joi.boolean().optional().messages({
            'boolean.base': 'Enable clustering must be a boolean'
        }),
        clusterRadius: Joi.number().integer().min(1).max(500).optional().messages({
            'number.min': 'Cluster radius must be between 1 and 500',
            'number.max': 'Cluster radius must be between 1 and 500'
        })
    }).required()
});

const exportParamsSchema = Joi.object({
    studyId: Joi.string().uuid().required().messages({
        'string.guid': 'Study ID must be a valid UUID'
    })
});

const exportQuerySchema = Joi.object({
    format: Joi.string().valid('json', 'geojson', 'csv', 'png').required().messages({
        'any.only': 'Invalid export format'
    }),
    includeStatistics: Joi.boolean().optional().messages({
        'boolean.base': 'Include statistics must be a boolean'
    }),
    includeClusters: Joi.boolean().optional().messages({
        'boolean.base': 'Include clusters must be a boolean'
    }),
    includeHotspots: Joi.boolean().optional().messages({
        'boolean.base': 'Include hotspots must be a boolean'
    })
});

const statisticsParamsSchema = Joi.object({
    studyId: Joi.string().uuid().required().messages({
        'string.guid': 'Study ID must be a valid UUID'
    })
});

/**
 * POST /api/heatmap/analyze
 * Generate heatmap analysis for a study
 */
router.post('/analyze',
    authenticateToken,
    validateRequest(heatmapAnalysisSchema),
    async (req, res) => {
        try {
            const analysisRequest: HeatmapAnalysisRequest = req.body;

            // TODO: Fetch actual response data from database
            // For now, we'll use mock data to demonstrate the service
            const mockPoints: HeatmapPoint[] = [
                { x: 100, y: 100, lat: 52.5200, lng: 13.4050, intensity: 0.8 },
                { x: 150, y: 120, lat: 52.5210, lng: 13.4060, intensity: 0.6 },
                { x: 200, y: 180, lat: 52.5220, lng: 13.4070, intensity: 0.9 },
                { x: 120, y: 110, lat: 52.5205, lng: 13.4055, intensity: 0.7 },
                { x: 300, y: 250, lat: 52.5250, lng: 13.4100, intensity: 0.5 }
            ];

            const analysisResult: HeatmapAnalysisResult = HeatmapService.analyzeHeatmap(
                mockPoints,
                analysisRequest.options
            );

            res.json({
                success: true,
                data: analysisResult
            });
        } catch (error) {
            console.error('Error analyzing heatmap:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to analyze heatmap data'
            });
        }
    }
);

/**
 * POST /api/heatmap/generate
 * Generate heatmap data without full analysis
 */
router.post('/generate',
    authenticateToken,
    validateRequest(heatmapAnalysisSchema),
    async (req, res) => {
        try {
            const analysisRequest: HeatmapAnalysisRequest = req.body;

            // TODO: Fetch actual response data from database
            const mockPoints: HeatmapPoint[] = [
                { x: 100, y: 100, lat: 52.5200, lng: 13.4050, intensity: 0.8 },
                { x: 150, y: 120, lat: 52.5210, lng: 13.4060, intensity: 0.6 },
                { x: 200, y: 180, lat: 52.5220, lng: 13.4070, intensity: 0.9 },
                { x: 120, y: 110, lat: 52.5205, lng: 13.4055, intensity: 0.7 },
                { x: 300, y: 250, lat: 52.5250, lng: 13.4100, intensity: 0.5 }
            ];

            const heatmapData = HeatmapService.generateHeatmap(
                mockPoints,
                analysisRequest.options
            );

            res.json({
                success: true,
                data: heatmapData
            });
        } catch (error) {
            console.error('Error generating heatmap:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate heatmap data'
            });
        }
    }
);

/**
 * GET /api/heatmap/export/:studyId
 * Export heatmap data in various formats
 */
router.get('/export/:studyId',
    authenticateToken,
    validateParams(exportParamsSchema),
    validateQuery(exportQuerySchema),
    async (req, res) => {
        try {
            const { studyId } = req.params;
            const exportOptions: HeatmapExportOptions = {
                format: req.query.format as 'json' | 'geojson' | 'csv' | 'png',
                includeStatistics: req.query.includeStatistics === 'true',
                includeClusters: req.query.includeClusters === 'true',
                includeHotspots: req.query.includeHotspots === 'true'
            };

            // TODO: Implement actual export functionality
            // For now, return a placeholder response

            switch (exportOptions.format) {
                case 'json':
                    res.json({
                        success: true,
                        data: {
                            studyId,
                            exportFormat: 'json',
                            timestamp: new Date().toISOString(),
                            // TODO: Add actual heatmap data
                        }
                    });
                    break;

                case 'geojson':
                    res.json({
                        type: 'FeatureCollection',
                        features: [
                            // TODO: Convert heatmap points to GeoJSON features
                        ]
                    });
                    break;

                case 'csv':
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', `attachment; filename="heatmap_${studyId}.csv"`);
                    res.send('lat,lng,intensity\n'); // TODO: Add actual CSV data
                    break;

                case 'png':
                    res.status(501).json({
                        success: false,
                        error: 'PNG export not yet implemented'
                    });
                    break;

                default:
                    res.status(400).json({
                        success: false,
                        error: 'Invalid export format'
                    });
            }
        } catch (error) {
            console.error('Error exporting heatmap:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export heatmap data'
            });
        }
    }
);

/**
 * GET /api/heatmap/study/:studyId/statistics
 * Get heatmap statistics for a study
 */
router.get('/study/:studyId/statistics',
    authenticateToken,
    validateParams(statisticsParamsSchema),
    async (req, res) => {
        try {
            const { studyId } = req.params;

            // TODO: Fetch actual response data and calculate statistics
            const mockStatistics = {
                totalResponses: 25,
                totalPoints: 150,
                averageIntensity: 0.65,
                maxIntensity: 1.0,
                minIntensity: 0.1,
                hotspotCount: 3,
                clusterCount: 5,
                coverageArea: {
                    minLat: 52.5100,
                    maxLat: 52.5300,
                    minLng: 13.4000,
                    maxLng: 13.4200
                }
            };

            res.json({
                success: true,
                data: mockStatistics
            });
        } catch (error) {
            console.error('Error fetching heatmap statistics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch heatmap statistics'
            });
        }
    }
);

export default router;