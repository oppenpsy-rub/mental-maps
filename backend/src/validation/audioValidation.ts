import Joi from 'joi';

export const audioMetadataSchema = Joi.object({
  speaker: Joi.string().max(100).optional(),
  dialect: Joi.string().max(100).optional(),
  region: Joi.string().max(100).optional(),
  recordingLocation: Joi.string().max(200).optional(),
  recordingDate: Joi.string().isoDate().optional(),
  quality: Joi.string().valid('low', 'medium', 'high').optional(),
  sampleRate: Joi.number().integer().min(8000).max(192000).optional(),
  bitRate: Joi.number().integer().min(32).max(320).optional(),
  channels: Joi.number().integer().min(1).max(8).optional(),
  format: Joi.string().max(50).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  
  // Research-specific metadata
  recordingEquipment: Joi.string().max(200).optional(),
  recordingConditions: Joi.string().max(500).optional(),
  transcription: Joi.string().max(1000).optional(),
  phoneticTranscription: Joi.string().max(1000).optional(),
  linguisticFeatures: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  notes: Joi.string().max(1000).optional(),
  researcherComments: Joi.string().max(1000).optional(),
  validationStatus: Joi.string().valid('pending', 'validated', 'rejected').optional()
}).unknown(true); // Allow additional custom metadata fields

export const audioUploadSchema = Joi.object({
  questionId: Joi.string().uuid().required(),
  metadata: audioMetadataSchema.optional()
});

export const updateAudioMetadataSchema = Joi.object({
  speaker: Joi.string().max(100).optional(),
  dialect: Joi.string().max(100).optional(),
  region: Joi.string().max(100).optional(),
  recordingLocation: Joi.string().max(200).optional(),
  recordingDate: Joi.string().isoDate().optional(),
  quality: Joi.string().valid('low', 'medium', 'high').optional(),
  sampleRate: Joi.number().integer().min(8000).max(192000).optional(),
  bitRate: Joi.number().integer().min(32).max(320).optional(),
  channels: Joi.number().integer().min(1).max(8).optional(),
  format: Joi.string().max(50).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  
  // Research-specific metadata
  recordingEquipment: Joi.string().max(200).optional(),
  recordingConditions: Joi.string().max(500).optional(),
  transcription: Joi.string().max(1000).optional(),
  phoneticTranscription: Joi.string().max(1000).optional(),
  linguisticFeatures: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  notes: Joi.string().max(1000).optional(),
  researcherComments: Joi.string().max(1000).optional(),
  validationStatus: Joi.string().valid('pending', 'validated', 'rejected').optional()
}).unknown(true).min(1); // At least one field must be provided, allow additional custom fields

export const audioQuerySchema = Joi.object({
  questionId: Joi.string().uuid().optional()
});