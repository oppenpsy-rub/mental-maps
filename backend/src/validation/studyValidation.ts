import Joi from 'joi';

// Study settings validation schemas
const mapConfigurationSchema = Joi.object({
  initialBounds: Joi.object({
    north: Joi.number().min(-90).max(90).required(),
    south: Joi.number().min(-90).max(90).required(),
    east: Joi.number().min(-180).max(180).required(),
    west: Joi.number().min(-180).max(180).required()
  }).optional(),
  center: Joi.array()
    .items(Joi.number())
    .length(2)
    .optional(),
  initialZoom: Joi.number().min(0).max(20).optional(),
  minZoom: Joi.number().min(0).max(20).optional(),
  maxZoom: Joi.number().min(0).max(20).optional(),
  allowedZoomLevels: Joi.array()
    .items(Joi.number().min(0).max(20))
    .length(2)
    .optional(),
  mapStyle: Joi.string()
    .valid('standard', 'satellite', 'terrain', 'dark', 'light')
    .optional(),
  enabledTools: Joi.array()
    .items(Joi.string().valid('pen', 'line', 'polygon', 'circle', 'text', 'heatmap'))
    .optional(),
  customLayers: Joi.array().optional()
}).optional();

const participantSettingsSchema = Joi.object({
  allowAnonymous: Joi.boolean().optional(),
  requireDemographics: Joi.boolean().optional(),
  maxParticipants: Joi.number().min(1).max(10000).optional()
}).optional();

const dataCollectionSchema = Joi.object({
  collectIPAddress: Joi.boolean().optional(),
  collectUserAgent: Joi.boolean().optional(),
  autoSave: Joi.boolean().optional()
}).optional();

const studySettingsSchema = Joi.object({
  mapConfiguration: mapConfigurationSchema,
  participantSettings: participantSettingsSchema,
  dataCollection: dataCollectionSchema
}).optional();

// Main study validation schemas
export const createStudySchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(500)
    .required()
    .messages({
      'string.min': 'Study title must be at least 3 characters long',
      'string.max': 'Study title cannot exceed 500 characters',
      'any.required': 'Study title is required'
    }),
  description: Joi.string()
    .max(5000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Study description cannot exceed 5000 characters'
    }),
  settings: studySettingsSchema
});

export const updateStudySchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(500)
    .optional()
    .messages({
      'string.min': 'Study title must be at least 3 characters long',
      'string.max': 'Study title cannot exceed 500 characters'
    }),
  description: Joi.string()
    .max(5000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Study description cannot exceed 5000 characters'
    }),
  settings: studySettingsSchema
});

// Question configuration schemas for different types
const mapDrawingConfigSchema = Joi.object({
  allowedDrawingTools: Joi.array()
    .items(Joi.string().valid('pen', 'line', 'polygon', 'circle', 'text'))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one drawing tool must be allowed',
      'any.required': 'Drawing tools configuration is required for map drawing questions'
    }),
  colors: Joi.array()
    .items(Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/))
    .optional(),
  maxResponses: Joi.number().min(1).max(100).optional(),
  timeLimit: Joi.number().min(10).max(3600).optional(),
  required: Joi.boolean().optional(),
  mapBounds: Joi.object({
    north: Joi.number().min(-90).max(90).required(),
    south: Joi.number().min(-90).max(90).required(),
    east: Joi.number().min(-180).max(180).required(),
    west: Joi.number().min(-180).max(180).required()
  }).optional()
});

const heatmapConfigSchema = Joi.object({
  heatmapSettings: Joi.object({
    radius: Joi.number().min(5).max(100).default(25),
    maxIntensity: Joi.number().min(0.1).max(2.0).default(1.0),
    gradient: Joi.object().pattern(
      Joi.number().min(0).max(1),
      Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/)
    ).optional()
  }).required(),
  intensityScale: Joi.object({
    min: Joi.number().min(0).default(0),
    max: Joi.number().min(1).max(10).default(5),
    step: Joi.number().min(0.1).max(1).default(1),
    labels: Joi.array().items(Joi.string()).optional()
  }).optional(),
  timeLimit: Joi.number().min(10).max(3600).optional(),
  required: Joi.boolean().optional(),
  mapBounds: Joi.object({
    north: Joi.number().min(-90).max(90).required(),
    south: Joi.number().min(-90).max(90).required(),
    east: Joi.number().min(-180).max(180).required(),
    west: Joi.number().min(-180).max(180).required()
  }).optional()
});

const pointSelectionConfigSchema = Joi.object({
  maxPoints: Joi.number().min(1).max(50).default(1),
  allowMultiplePoints: Joi.boolean().default(false),
  pointCategories: Joi.array()
    .items(Joi.object({
      id: Joi.string().required(),
      label: Joi.string().required(),
      color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required(),
      icon: Joi.string().optional()
    }))
    .optional(),
  timeLimit: Joi.number().min(10).max(3600).optional(),
  required: Joi.boolean().optional(),
  mapBounds: Joi.object({
    north: Joi.number().min(-90).max(90).required(),
    south: Joi.number().min(-90).max(90).required(),
    east: Joi.number().min(-180).max(180).required(),
    west: Joi.number().min(-180).max(180).required()
  }).optional()
});

const areaSelectionConfigSchema = Joi.object({
  maxAreas: Joi.number().min(1).max(20).default(1),
  allowOverlapping: Joi.boolean().default(false),
  areaCategories: Joi.array()
    .items(Joi.object({
      id: Joi.string().required(),
      label: Joi.string().required(),
      color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required(),
      fillOpacity: Joi.number().min(0).max(1).default(0.3)
    }))
    .optional(),
  timeLimit: Joi.number().min(10).max(3600).optional(),
  required: Joi.boolean().optional(),
  mapBounds: Joi.object({
    north: Joi.number().min(-90).max(90).required(),
    south: Joi.number().min(-90).max(90).required(),
    east: Joi.number().min(-180).max(180).required(),
    west: Joi.number().min(-180).max(180).required()
  }).optional()
});

const ratingConfigSchema = Joi.object({
  ratingScale: Joi.object({
    min: Joi.number().min(1).required(),
    max: Joi.number().min(2).required(),
    step: Joi.number().min(0.1).max(1).default(1),
    labels: Joi.array()
      .items(Joi.string())
      .length(Joi.ref('max'))
      .optional(),
    scaleType: Joi.string().valid('likert', 'semantic_differential', 'numeric').default('likert')
  }).required(),
  ratingAspects: Joi.array()
    .items(Joi.object({
      id: Joi.string().required(),
      label: Joi.string().required(),
      description: Joi.string().optional()
    }))
    .min(1)
    .required(),
  timeLimit: Joi.number().min(10).max(3600).optional(),
  required: Joi.boolean().optional()
});

const audioResponseConfigSchema = Joi.object({
  audioRequired: Joi.boolean().default(true),
  allowReplay: Joi.boolean().default(true),
  maxReplays: Joi.number().min(1).max(10).optional(),
  responseType: Joi.string().valid('map_drawing', 'point_selection', 'area_selection', 'rating').required(),
  responseConfiguration: Joi.when('responseType', {
    is: 'map_drawing',
    then: mapDrawingConfigSchema,
    otherwise: Joi.when('responseType', {
      is: 'point_selection',
      then: pointSelectionConfigSchema,
      otherwise: Joi.when('responseType', {
        is: 'area_selection',
        then: areaSelectionConfigSchema,
        otherwise: Joi.when('responseType', {
          is: 'rating',
          then: ratingConfigSchema,
          otherwise: Joi.object()
        })
      })
    })
  }),
  timeLimit: Joi.number().min(10).max(3600).optional(),
  required: Joi.boolean().optional()
});

// Question validation schemas
export const createQuestionSchema = Joi.object({
  questionText: Joi.string()
    .min(5)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Question text must be at least 5 characters long',
      'string.max': 'Question text cannot exceed 2000 characters',
      'any.required': 'Question text is required'
    }),
  questionType: Joi.string()
    .valid('map_drawing', 'heatmap', 'point_selection', 'area_selection', 'audio_response', 'rating')
    .required()
    .messages({
      'any.only': 'Question type must be one of: map_drawing, heatmap, point_selection, area_selection, audio_response, rating',
      'any.required': 'Question type is required'
    }),
  configuration: Joi.when('questionType', {
    switch: [
      { is: 'map_drawing', then: mapDrawingConfigSchema },
      { is: 'heatmap', then: heatmapConfigSchema },
      { is: 'point_selection', then: pointSelectionConfigSchema },
      { is: 'area_selection', then: areaSelectionConfigSchema },
      { is: 'audio_response', then: audioResponseConfigSchema },
      { is: 'rating', then: ratingConfigSchema }
    ],
    otherwise: Joi.object()
  }).required(),
  orderIndex: Joi.number().min(0).optional()
});

export const updateQuestionSchema = Joi.object({
  questionText: Joi.string()
    .min(5)
    .max(2000)
    .optional()
    .messages({
      'string.min': 'Question text must be at least 5 characters long',
      'string.max': 'Question text cannot exceed 2000 characters'
    }),
  questionType: Joi.string()
    .valid('map_drawing', 'heatmap', 'point_selection', 'area_selection', 'audio_response', 'rating')
    .optional()
    .messages({
      'any.only': 'Question type must be one of: map_drawing, heatmap, point_selection, area_selection, audio_response, rating'
    }),
  configuration: Joi.when('questionType', {
    switch: [
      { is: 'map_drawing', then: mapDrawingConfigSchema },
      { is: 'heatmap', then: heatmapConfigSchema },
      { is: 'point_selection', then: pointSelectionConfigSchema },
      { is: 'area_selection', then: areaSelectionConfigSchema },
      { is: 'audio_response', then: audioResponseConfigSchema },
      { is: 'rating', then: ratingConfigSchema }
    ],
    otherwise: Joi.object()
  }).optional(),
  orderIndex: Joi.number().min(0).optional()
});

export const reorderQuestionsSchema = Joi.object({
  questionOrders: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().uuid().required(),
        orderIndex: Joi.number().min(0).required()
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one question order must be provided',
      'any.required': 'Question orders are required'
    })
});

// Query parameter validation
export const studyQuerySchema = Joi.object({
  page: Joi.number().min(1).optional().default(1),
  limit: Joi.number().min(1).max(100).optional().default(20),
  search: Joi.string().max(255).optional(),
  active: Joi.boolean().optional(),
  sortBy: Joi.string().valid('title', 'createdAt', 'updatedAt').optional().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc')
});

export const studyIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Study ID must be a valid UUID',
      'any.required': 'Study ID is required'
    })
});

export const questionIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
  questionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Question ID must be a valid UUID',
      'any.required': 'Question ID is required'
    })
});