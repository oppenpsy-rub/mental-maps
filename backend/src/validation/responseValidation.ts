import Joi from 'joi';

// GeoJSON geometry validation schemas
const pointGeometrySchema = Joi.object({
  type: Joi.string().valid('Point').required(),
  coordinates: Joi.array().items(Joi.number()).length(2).required()
});

const lineStringGeometrySchema = Joi.object({
  type: Joi.string().valid('LineString').required(),
  coordinates: Joi.array().items(
    Joi.array().items(Joi.number()).length(2)
  ).min(2).required()
});

const polygonGeometrySchema = Joi.object({
  type: Joi.string().valid('Polygon').required(),
  coordinates: Joi.array().items(
    Joi.array().items(
      Joi.array().items(Joi.number()).length(2)
    ).min(4) // Minimum 4 points for a closed polygon
  ).min(1).required()
});

const geometrySchema = Joi.alternatives().try(
  pointGeometrySchema,
  lineStringGeometrySchema,
  polygonGeometrySchema
);

// Element style validation
const elementStyleSchema = Joi.object({
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  fillColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  strokeWidth: Joi.number().min(0).max(50).optional(),
  strokeColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  opacity: Joi.number().min(0).max(1).optional(),
  fillOpacity: Joi.number().min(0).max(1).optional(),
  fontSize: Joi.number().min(8).max(72).optional(),
  fontFamily: Joi.string().max(50).optional(),
  fontWeight: Joi.string().valid('normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900').optional(),
  textAlign: Joi.string().valid('left', 'center', 'right').optional(),
  radius: Joi.number().min(0).max(1000).optional(),
  dashArray: Joi.array().items(Joi.number().min(0)).optional()
}).optional();

// Element metadata validation
const elementMetadataSchema = Joi.object({
  label: Joi.string().max(200).optional(),
  description: Joi.string().max(1000).optional(),
  intensity: Joi.number().min(0).max(1).optional(),
  confidence: Joi.number().min(0).max(1).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  userNotes: Joi.string().max(500).optional(),
  createdWith: Joi.string().max(50).optional(),
  editHistory: Joi.array().items(
    Joi.object({
      timestamp: Joi.number().required(),
      action: Joi.string().valid('created', 'modified', 'moved', 'styled').required(),
      changes: Joi.any().optional()
    })
  ).optional()
}).optional();

// Drawing element validation
const drawingElementSchema = Joi.object({
  type: Joi.string().valid('point', 'line', 'polygon', 'circle', 'text', 'heatmap_point').required(),
  geometry: geometrySchema.required(),
  style: elementStyleSchema,
  metadata: elementMetadataSchema
});

// Map bounds validation
const mapBoundsSchema = Joi.object({
  north: Joi.number().min(-90).max(90).required(),
  south: Joi.number().min(-90).max(90).required(),
  east: Joi.number().min(-180).max(180).required(),
  west: Joi.number().min(-180).max(180).required()
}).custom((value, helpers) => {
  if (value.north <= value.south) {
    return helpers.error('any.invalid', { message: 'North must be greater than south' });
  }
  if (value.east <= value.west) {
    return helpers.error('any.invalid', { message: 'East must be greater than west' });
  }
  return value;
});

// Drawing data validation
const drawingDataSchema = Joi.object({
  version: Joi.string().optional(),
  canvasData: Joi.any().optional(), // Fabric.js canvas data - flexible structure
  geoJsonData: Joi.object({
    type: Joi.string().valid('FeatureCollection').required(),
    features: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('Feature').required(),
        geometry: geometrySchema.required(),
        properties: Joi.object().optional()
      })
    ).optional()
  }).optional(),
  metadata: Joi.object({
    mapBounds: mapBoundsSchema.optional(),
    zoomLevel: Joi.number().min(0).max(20).optional(),
    mapStyle: Joi.string().max(50).optional(),
    drawingDuration: Joi.number().min(0).optional(),
    totalElements: Joi.number().min(0).optional(),
    canvasSize: Joi.object({
      width: Joi.number().min(1).required(),
      height: Joi.number().min(1).required()
    }).optional(),
    projection: Joi.string().max(50).optional()
  }).optional()
});

// Map drawing validation
const mapDrawingSchema = Joi.object({
  bounds: mapBoundsSchema.optional(),
  drawingData: drawingDataSchema.required(),
  elements: Joi.array().items(drawingElementSchema).optional()
});

// Response data validation
const responseDataSchema = Joi.object({
  textResponse: Joi.string().max(5000).optional(),
  ratingValue: Joi.number().min(0).max(10).optional(),
  selectedOptions: Joi.array().items(Joi.string().max(200)).max(20).optional(),
  demographicResponses: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string().max(500),
      Joi.number(),
      Joi.boolean(),
      Joi.array().items(Joi.string().max(200))
    )
  ).optional(),
  audioPlayCount: Joi.number().min(0).optional(),
  audioTotalListenTime: Joi.number().min(0).optional(),
  interactionEvents: Joi.array().items(
    Joi.object({
      timestamp: Joi.number().required(),
      event: Joi.string().max(100).required(),
      data: Joi.any().optional()
    })
  ).optional()
});

// Submit response validation
export const submitResponseSchema = Joi.object({
  participantId: Joi.string().uuid().required(),
  questionId: Joi.string().uuid().required(),
  responseData: responseDataSchema.required(),
  mapDrawing: mapDrawingSchema.optional(),
  responseTimeMs: Joi.number().min(0).optional()
});

// Update response validation
export const updateResponseSchema = Joi.object({
  responseData: responseDataSchema.optional(),
  mapDrawing: mapDrawingSchema.optional(),
  responseTimeMs: Joi.number().min(0).optional()
}).min(1); // At least one field must be provided

// Response filters validation
export const responseFiltersSchema = Joi.object({
  participantId: Joi.string().uuid().optional(),
  questionId: Joi.string().uuid().optional(),
  questionType: Joi.string().max(50).optional(),
  hasMapDrawing: Joi.boolean().optional(),
  completedOnly: Joi.boolean().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional()
}).custom((value, helpers) => {
  if (value.dateFrom && value.dateTo && value.dateFrom >= value.dateTo) {
    return helpers.error('any.invalid', { message: 'dateFrom must be before dateTo' });
  }
  return value;
});

// Export format validation
export const exportFormatSchema = Joi.object({
  format: Joi.string().valid('json', 'csv').default('json'),
  includeMapDrawings: Joi.boolean().default(true),
  includeDemographics: Joi.boolean().default(true),
  anonymize: Joi.boolean().default(true)
});

// Validation middleware functions
export const validateSubmitResponse = (req: any, res: any, next: any) => {
  const { error } = submitResponseSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      type: 'VALIDATION_ERROR',
      message: 'Invalid response data',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

export const validateUpdateResponse = (req: any, res: any, next: any) => {
  const { error } = updateResponseSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      type: 'VALIDATION_ERROR',
      message: 'Invalid update data',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

export const validateResponseFilters = (req: any, res: any, next: any) => {
  const { error } = responseFiltersSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      type: 'VALIDATION_ERROR',
      message: 'Invalid filter parameters',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

export const validateExportFormat = (req: any, res: any, next: any) => {
  const { error } = exportFormatSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      type: 'VALIDATION_ERROR',
      message: 'Invalid export parameters',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};