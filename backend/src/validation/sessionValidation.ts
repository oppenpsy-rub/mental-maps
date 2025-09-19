import Joi from 'joi';

// Session metadata schema
const sessionMetadataSchema = Joi.object({
  userAgent: Joi.string().required(),
  screenResolution: Joi.string().required(),
  timezone: Joi.string().required(),
  language: Joi.string().required()
});

// Session progress schema
const sessionProgressSchema = Joi.object({
  totalQuestions: Joi.number().integer().min(0).required(),
  completedQuestions: Joi.number().integer().min(0).required(),
  currentQuestion: Joi.number().integer().min(0).required(),
  startTime: Joi.number().integer().positive().required(),
  lastSaveTime: Joi.number().integer().positive().required()
});

// Session data schema
const sessionDataSchema = Joi.object({
  participantId: Joi.string().uuid().required(),
  studyId: Joi.string().uuid().required(),
  currentQuestionIndex: Joi.number().integer().min(0).required(),
  responses: Joi.object().pattern(Joi.string(), Joi.any()).required(),
  drawingStates: Joi.object().pattern(Joi.string(), Joi.any()).required(),
  progress: sessionProgressSchema.required(),
  metadata: sessionMetadataSchema.required()
});

// Save session request schema
export const saveSessionSchema = Joi.object({
  sessionData: sessionDataSchema.required(),
  incrementalUpdate: Joi.boolean().optional().default(false)
});

// Participant ID parameter schema
export const participantIdParamSchema = Joi.object({
  participantId: Joi.string().uuid().required()
});

// Study ID parameter schema
export const studyIdParamSchema = Joi.object({
  studyId: Joi.string().uuid().required()
});

// Validation middleware functions
export const validateSaveSession = (req: any, res: any, next: any) => {
  const { error } = saveSessionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

export const validateParticipantId = (req: any, res: any, next: any) => {
  const { error } = participantIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid participant ID',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

export const validateStudyId = (req: any, res: any, next: any) => {
  const { error } = studyIdParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid study ID',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};