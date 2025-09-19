import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StudyService } from '../services/StudyService';
import { StudyStatus } from '../models/Study';

describe('Study Status Management Integration', () => {
    let studyService: StudyService;

    const mockResearcherId = 'researcher-123';
    const mockStudyId = 'study-123';

    beforeEach(() => {
        // Create a real service instance for integration testing
        studyService = new StudyService();
    });

    describe('Status Validation Logic', () => {
        it('should validate status transitions correctly', () => {
            // Test the private method through public interface
            const service = studyService as any;

            // Test valid transitions
            expect(service.getValidStatusTransitions(StudyStatus.DRAFT)).toContain(StudyStatus.READY);
            expect(service.getValidStatusTransitions(StudyStatus.READY)).toContain(StudyStatus.ACTIVE);
            expect(service.getValidStatusTransitions(StudyStatus.ACTIVE)).toContain(StudyStatus.PAUSED);
            expect(service.getValidStatusTransitions(StudyStatus.PAUSED)).toContain(StudyStatus.ACTIVE);

            // Test invalid transitions
            expect(service.getValidStatusTransitions(StudyStatus.DRAFT)).not.toContain(StudyStatus.ACTIVE);
            expect(service.getValidStatusTransitions(StudyStatus.COMPLETED)).not.toContain(StudyStatus.ACTIVE);
            expect(service.getValidStatusTransitions(StudyStatus.ARCHIVED)).toHaveLength(0);
        });

        it('should validate study readiness correctly', async () => {
            const service = studyService as any;

            // Test study without questions
            const studyWithoutQuestions = {
                questions: [],
                settings: {}
            };

            const errors1 = await service.validateStudyReadiness(studyWithoutQuestions);
            expect(errors1).toContain('Study must have at least one question');
            expect(errors1).toContain('Study must have map configuration');

            // Test study with valid configuration
            const validStudy = {
                questions: [{
                    questionText: 'Test Question',
                    questionType: 'map_drawing',
                    configuration: { allowedDrawingTools: ['pen'] },
                    orderIndex: 0
                }],
                settings: {
                    mapConfiguration: {
                        initialBounds: { north: 1, south: 0, east: 1, west: 0 }
                    }
                }
            };

            const errors2 = await service.validateStudyReadiness(validStudy);
            expect(errors2).toHaveLength(0);
        });

        it('should update study status with history tracking', () => {
            const service = studyService as any;

            const study = {
                status: StudyStatus.DRAFT,
                statusHistory: [] as any[],
                active: false
            };

            service.updateStudyStatus(study, StudyStatus.READY, mockResearcherId, 'Test reason');

            expect(study.status).toBe(StudyStatus.READY);
            expect(study.statusHistory).toHaveLength(1);
            expect(study.statusHistory[0]).toMatchObject({
                status: StudyStatus.READY,
                reason: 'Test reason',
                changedBy: mockResearcherId
            });
            expect(study.statusHistory[0].timestamp).toBeInstanceOf(Date);
        });

        it('should handle activation status correctly', () => {
            const service = studyService as any;

            const study = {
                status: StudyStatus.READY,
                statusHistory: [] as any[],
                active: false,
                activatedAt: null
            };

            service.updateStudyStatus(study, StudyStatus.ACTIVE, mockResearcherId);

            expect(study.status).toBe(StudyStatus.ACTIVE);
            expect(study.active).toBe(true);
            expect(study.activatedAt).toBeInstanceOf(Date);
        });

        it('should handle deactivation status correctly', () => {
            const service = studyService as any;

            const study = {
                status: StudyStatus.ACTIVE,
                statusHistory: [] as any[],
                active: true,
                deactivatedAt: null
            };

            service.updateStudyStatus(study, StudyStatus.PAUSED, mockResearcherId);

            expect(study.status).toBe(StudyStatus.PAUSED);
            expect(study.active).toBe(false);
            expect(study.deactivatedAt).toBeInstanceOf(Date);
        });
    });

    describe('Question Configuration Validation', () => {
        it('should validate map drawing configuration', () => {
            const service = studyService as any;

            // Valid configuration
            expect(() => {
                service.validateQuestionConfiguration('map_drawing', {
                    allowedDrawingTools: ['pen', 'polygon']
                });
            }).not.toThrow();

            // Invalid configuration - no tools
            expect(() => {
                service.validateQuestionConfiguration('map_drawing', {
                    allowedDrawingTools: []
                });
            }).toThrow('Map drawing questions must specify at least one allowed drawing tool');

            // Invalid configuration - missing tools
            expect(() => {
                service.validateQuestionConfiguration('map_drawing', {});
            }).toThrow('Map drawing questions must specify at least one allowed drawing tool');
        });

        it('should validate heatmap configuration', () => {
            const service = studyService as any;

            // Valid configuration
            expect(() => {
                service.validateQuestionConfiguration('heatmap', {
                    heatmapSettings: {
                        radius: 25,
                        maxIntensity: 1.0
                    }
                });
            }).not.toThrow();

            // Invalid configuration - missing settings
            expect(() => {
                service.validateQuestionConfiguration('heatmap', {});
            }).toThrow('Heatmap questions must specify heatmap settings');
        });

        it('should validate rating configuration', () => {
            const service = studyService as any;

            // Valid configuration
            expect(() => {
                service.validateQuestionConfiguration('rating', {
                    ratingScale: { min: 1, max: 5 },
                    ratingAspects: [{ id: '1', label: 'Test' }]
                });
            }).not.toThrow();

            // Invalid configuration - no scale
            expect(() => {
                service.validateQuestionConfiguration('rating', {
                    ratingAspects: [{ id: '1', label: 'Test' }]
                });
            }).toThrow('Rating questions must specify a rating scale');

            // Invalid configuration - no aspects
            expect(() => {
                service.validateQuestionConfiguration('rating', {
                    ratingScale: { min: 1, max: 5 },
                    ratingAspects: []
                });
            }).toThrow('Rating questions must specify at least one rating aspect');

            // Invalid configuration - invalid scale
            expect(() => {
                service.validateQuestionConfiguration('rating', {
                    ratingScale: { min: 5, max: 1 },
                    ratingAspects: [{ id: '1', label: 'Test' }]
                });
            }).toThrow('Rating scale minimum must be less than maximum');
        });

        it('should validate audio response configuration', () => {
            const service = studyService as any;

            // Valid configuration
            expect(() => {
                service.validateQuestionConfiguration('audio_response', {
                    responseType: 'map_drawing',
                    responseConfiguration: {
                        allowedDrawingTools: ['pen']
                    }
                });
            }).not.toThrow();

            // Invalid configuration - no response type
            expect(() => {
                service.validateQuestionConfiguration('audio_response', {});
            }).toThrow('Audio response questions must specify a response type');
        });
    });

    describe('Status Enum Values', () => {
        it('should have correct status enum values', () => {
            expect(StudyStatus.DRAFT).toBe('draft');
            expect(StudyStatus.READY).toBe('ready');
            expect(StudyStatus.ACTIVE).toBe('active');
            expect(StudyStatus.PAUSED).toBe('paused');
            expect(StudyStatus.COMPLETED).toBe('completed');
            expect(StudyStatus.ARCHIVED).toBe('archived');
        });
    });
});