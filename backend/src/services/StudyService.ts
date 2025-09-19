import { StudyRepository } from '../repositories/StudyRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { Study, StudyStatus } from '../models/Study';
import { Question } from '../models/Question';
import { ApiError, ValidationError } from '../types/errors';

export interface CreateStudyRequest {
    title: string;
    description?: string;
    settings?: any;
}

export interface UpdateStudyRequest {
    title?: string;
    description?: string;
    settings?: any;
}

export interface CreateQuestionRequest {
    questionText: string;
    questionType: string;
    configuration?: any;
    orderIndex?: number;
}

export interface UpdateQuestionRequest {
    questionText?: string;
    questionType?: string;
    configuration?: any;
    orderIndex?: number;
}

export interface StudyListOptions {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface QuestionOrderUpdate {
    questionId: string;
    orderIndex: number;
}

export class StudyService {
    private studyRepository: StudyRepository;
    private questionRepository: QuestionRepository;

    constructor() {
        this.studyRepository = new StudyRepository();
        this.questionRepository = new QuestionRepository();
    }

    /**
     * Create a new study
     */
    async createStudy(researcherId: string, data: CreateStudyRequest): Promise<Study> {
        try {
            // Check for duplicate title for this researcher
            const existingStudies = await this.studyRepository.findByResearcher(researcherId);
            const duplicateTitle = existingStudies.find(
                study => study.title.toLowerCase() === data.title.toLowerCase()
            );

            if (duplicateTitle) {
                throw new ValidationError('A study with this title already exists');
            }

            const study = new Study();
            study.researcherId = researcherId;
            study.title = data.title;
            study.description = data.description || '';
            study.settings = data.settings || {};
            study.status = StudyStatus.DRAFT;
            study.active = false; // New studies start inactive
            study.statusHistory = [{
                status: StudyStatus.DRAFT,
                timestamp: new Date(),
                reason: 'Study created',
                changedBy: researcherId
            }];

            return await this.studyRepository.create(study);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to create study', 500, 'STUDY_CREATION_ERROR', error);
        }
    }

    /**
     * Get studies for a researcher with pagination and filtering
     */
    async getStudiesForResearcher(
        researcherId: string,
        options: StudyListOptions = {}
    ): Promise<{ studies: Study[]; total: number; page: number; limit: number }> {
        try {
            const { page = 1, limit = 20, search, active, sortBy = 'createdAt', sortOrder = 'desc' } = options;

            let studies = await this.studyRepository.findByResearcher(researcherId);

            // Apply filters
            if (search) {
                const searchLower = search.toLowerCase();
                studies = studies.filter(study =>
                    study.title.toLowerCase().includes(searchLower) ||
                    (study.description && study.description.toLowerCase().includes(searchLower))
                );
            }

            if (active !== undefined) {
                studies = studies.filter(study => study.active === active);
            }

            // Apply sorting
            studies.sort((a, b) => {
                let aValue: any, bValue: any;

                switch (sortBy) {
                    case 'title':
                        aValue = a.title.toLowerCase();
                        bValue = b.title.toLowerCase();
                        break;
                    case 'updatedAt':
                        aValue = a.updatedAt;
                        bValue = b.updatedAt;
                        break;
                    default:
                        aValue = a.createdAt;
                        bValue = b.createdAt;
                }

                if (sortOrder === 'asc') {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                } else {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                }
            });

            const total = studies.length;
            const startIndex = (page - 1) * limit;
            const paginatedStudies = studies.slice(startIndex, startIndex + limit);

            return {
                studies: paginatedStudies,
                total,
                page,
                limit
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to get studies', 500, 'STUDY_RETRIEVAL_ERROR', error);
        }
    }

    /**
     * Get a single study by ID
     */
    async getStudyById(studyId: string, includeQuestions: boolean = false): Promise<Study> {
        try {
            let study: Study | null;

            if (includeQuestions) {
                study = await this.studyRepository.findWithQuestions(studyId);
            } else {
                study = await this.studyRepository.findById(studyId);
            }

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            return study;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to get study', 500, 'STUDY_RETRIEVAL_ERROR', error);
        }
    }

    /**
     * Update a study
     */
    async updateStudy(studyId: string, researcherId: string, data: UpdateStudyRequest): Promise<Study> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to update this study');
            }

            // Check for duplicate title if title is being updated
            if (data.title !== undefined && data.title !== study.title) {
                const existingStudies = await this.studyRepository.findByResearcher(researcherId);
                const duplicateTitle = existingStudies.find(
                    s => s.id !== studyId && s.title.toLowerCase() === data.title!.toLowerCase()
                );

                if (duplicateTitle) {
                    throw new ValidationError('A study with this title already exists');
                }
            }

            // Update fields
            if (data.title !== undefined) study.title = data.title;
            if (data.description !== undefined) study.description = data.description;
            if (data.settings !== undefined) {
                study.settings = { ...study.settings, ...data.settings };
            }

            return await this.studyRepository.update(study.id, study);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to update study', 500, 'STUDY_UPDATE_ERROR', error);
        }
    }

    /**
     * Delete a study
     */
    async deleteStudy(studyId: string, researcherId: string): Promise<void> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to delete this study');
            }

            // Check if study is active
            if (study.active) {
                throw new ValidationError('Cannot delete an active study. Please deactivate it first.');
            }

            await this.studyRepository.delete(studyId);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to delete study', 500, 'STUDY_DELETION_ERROR', error);
        }
    }

    /**
     * Validate study readiness for activation
     */
    private async validateStudyReadiness(study: Study): Promise<string[]> {
        const errors: string[] = [];

        // Check if study has questions - load them separately if not included
        let questions = study.questions;
        if (!questions) {
            questions = await this.questionRepository.findByStudy(study.id);
        }
        
        if (!questions || questions.length === 0) {
            errors.push('Study must have at least one question');
        }

        // Check if all questions are properly configured
        if (questions && questions.length > 0) {
            for (const question of questions) {
                if (!question.questionText || question.questionText.trim().length === 0) {
                    errors.push(`Question at position ${question.orderIndex + 1} is missing text`);
                }

                // Validate question configuration
                try {
                    this.validateQuestionConfiguration(question.questionType, question.configuration);
                } catch (validationError) {
                    if (validationError instanceof ValidationError) {
                        errors.push(`Question ${question.orderIndex + 1}: ${validationError.message}`);
                    }
                }
            }
        }

        // Check study settings
        if (!study.settings.mapConfiguration) {
            errors.push('Study must have map configuration');
        }

        return errors;
    }

    /**
     * Update study status with history tracking
     */
    private updateStudyStatus(study: Study, newStatus: any, researcherId: string, reason?: string): void {
        const oldStatus = study.status;
        study.status = newStatus;

        // Add to status history
        if (!study.statusHistory) {
            study.statusHistory = [];
        }

        study.statusHistory.push({
            status: newStatus,
            timestamp: new Date(),
            reason,
            changedBy: researcherId
        });

        // Update activation timestamps
        if (newStatus === 'active') {
            study.active = true;
            study.activatedAt = new Date();
        } else if (oldStatus === 'active') {
            study.active = false;
            study.deactivatedAt = new Date();
        }
    }

    /**
     * Activate a study
     */
    async activateStudy(studyId: string, researcherId: string, reason?: string): Promise<Study> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to activate this study');
            }

            // Check current status
            if (study.status === 'active') {
                throw new ValidationError('Study is already active');
            }

            if (study.status === 'completed' || study.status === 'archived') {
                throw new ValidationError(`Cannot activate ${study.status} study`);
            }

            // Validate study readiness
            const validationErrors = await this.validateStudyReadiness(study);
            if (validationErrors.length > 0) {
                throw new ValidationError(`Cannot activate study: ${validationErrors.join(', ')}`);
            }

            // Update status
            this.updateStudyStatus(study, 'active', researcherId, reason);

            return await this.studyRepository.update(study.id, study);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to activate study', 500, 'STUDY_ACTIVATION_ERROR', error);
        }
    }

    /**
     * Deactivate a study (pause it)
     */
    async deactivateStudy(studyId: string, researcherId: string, reason?: string): Promise<Study> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to deactivate this study');
            }

            // Check current status
            if (study.status !== 'active') {
                throw new ValidationError('Only active studies can be deactivated');
            }

            // Update status to paused
            this.updateStudyStatus(study, 'paused', researcherId, reason);

            return await this.studyRepository.update(study.id, study);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to deactivate study', 500, 'STUDY_DEACTIVATION_ERROR', error);
        }
    }

    /**
     * Change study status
     */
    async changeStudyStatus(
        studyId: string, 
        researcherId: string, 
        newStatus: any, 
        reason?: string
    ): Promise<Study> {
        try {
            const study = await this.studyRepository.findWithQuestions(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to change this study status');
            }

            // Validate status transition
            const validTransitions = this.getValidStatusTransitions(study.status);
            if (!validTransitions.includes(newStatus)) {
                throw new ValidationError(
                    `Cannot change status from ${study.status} to ${newStatus}. Valid transitions: ${validTransitions.join(', ')}`
                );
            }

            // Special validation for activation
            if (newStatus === 'active') {
                const validationErrors = await this.validateStudyReadiness(study);
                if (validationErrors.length > 0) {
                    throw new ValidationError(`Cannot activate study: ${validationErrors.join(', ')}`);
                }
            }

            // Update status
            this.updateStudyStatus(study, newStatus, researcherId, reason);

            return await this.studyRepository.update(study.id, study);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to change study status', 500, 'STUDY_STATUS_CHANGE_ERROR', error);
        }
    }

    /**
     * Get valid status transitions for current status
     */
    private getValidStatusTransitions(currentStatus: any): string[] {
        const transitions: Record<string, string[]> = {
            'draft': ['ready', 'archived'],
            'ready': ['active', 'draft', 'archived'],
            'active': ['paused', 'completed'],
            'paused': ['active', 'completed', 'archived'],
            'completed': ['archived'],
            'archived': []
        };

        return transitions[currentStatus] || [];
    }

    /**
     * Get study status information
     */
    async getStudyStatus(studyId: string, researcherId: string): Promise<{
        currentStatus: any;
        statusHistory: any[];
        validTransitions: string[];
        canActivate: boolean;
        validationErrors: string[];
    }> {
        try {
            const study = await this.studyRepository.findWithQuestions(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to view this study');
            }

            const validationErrors = await this.validateStudyReadiness(study);
            const validTransitions = this.getValidStatusTransitions(study.status);

            return {
                currentStatus: study.status,
                statusHistory: study.statusHistory || [],
                validTransitions,
                canActivate: validationErrors.length === 0 && validTransitions.includes('active'),
                validationErrors
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to get study status', 500, 'STUDY_STATUS_ERROR', error);
        }
    }

    /**
     * Get questions for a study
     */
    async getStudyQuestions(studyId: string, researcherId: string): Promise<Question[]> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to view this study');
            }

            return await this.questionRepository.findByStudy(studyId);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to get study questions', 500, 'QUESTION_RETRIEVAL_ERROR', error);
        }
    }

    /**
     * Get questions for a study (for participation - no permission check)
     */
    async getStudyQuestionsForParticipation(studyId: string): Promise<Question[]> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (!study.active) {
                throw ApiError.forbidden('Study is not active');
            }

            return await this.questionRepository.findByStudy(studyId);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to get study questions for participation', 500, 'QUESTION_RETRIEVAL_ERROR', error);
        }
    }

    /**
     * Validate question configuration based on question type
     */
    private validateQuestionConfiguration(questionType: string, configuration: any): void {
        switch (questionType) {
            case 'map_drawing':
                if (!configuration.allowedDrawingTools || configuration.allowedDrawingTools.length === 0) {
                    throw new ValidationError('Map drawing questions must specify at least one allowed drawing tool');
                }
                break;

            case 'heatmap':
                if (!configuration.heatmapSettings) {
                    throw new ValidationError('Heatmap questions must specify heatmap settings');
                }
                break;

            case 'point_selection':
                if (configuration.maxPoints !== undefined && configuration.maxPoints < 1) {
                    throw new ValidationError('Point selection questions must allow at least 1 point');
                }
                break;

            case 'area_selection':
                if (configuration.maxAreas !== undefined && configuration.maxAreas < 1) {
                    throw new ValidationError('Area selection questions must allow at least 1 area');
                }
                break;

            case 'rating':
                if (!configuration.ratingScale) {
                    throw new ValidationError('Rating questions must specify a rating scale');
                }
                if (!configuration.ratingAspects || configuration.ratingAspects.length === 0) {
                    throw new ValidationError('Rating questions must specify at least one rating aspect');
                }
                if (configuration.ratingScale.min >= configuration.ratingScale.max) {
                    throw new ValidationError('Rating scale minimum must be less than maximum');
                }
                break;

            case 'audio_response':
                if (!configuration.responseType) {
                    throw new ValidationError('Audio response questions must specify a response type');
                }
                // Recursively validate the response configuration
                if (configuration.responseConfiguration) {
                    this.validateQuestionConfiguration(configuration.responseType, configuration.responseConfiguration);
                }
                break;
        }
    }

    /**
     * Add a question to a study
     */
    async addQuestion(studyId: string, researcherId: string, data: CreateQuestionRequest): Promise<Question> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to modify this study');
            }

            // Cannot add questions to active studies
            if (study.active) {
                throw new ValidationError('Cannot add questions to an active study');
            }

            // Validate question configuration
            this.validateQuestionConfiguration(data.questionType, data.configuration || {});

            // Get current questions to determine order index
            const existingQuestions = await this.questionRepository.findByStudy(studyId);
            const orderIndex = data.orderIndex !== undefined
                ? data.orderIndex
                : existingQuestions.length;

            // If orderIndex is specified, shift other questions
            if (data.orderIndex !== undefined) {
                await this.questionRepository.shiftQuestionsOrder(studyId, data.orderIndex, 1);
            }

            const question = new Question();
            question.studyId = studyId;
            question.questionText = data.questionText;
            question.questionType = data.questionType as any;
            question.configuration = data.configuration || {};
            question.orderIndex = orderIndex;

            return await this.questionRepository.create(question);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to add question', 500, 'QUESTION_CREATION_ERROR', error);
        }
    }

    /**
     * Update a question
     */
    async updateQuestion(
        studyId: string,
        questionId: string,
        researcherId: string,
        data: UpdateQuestionRequest
    ): Promise<Question> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to modify this study');
            }

            // Cannot modify questions in active studies
            if (study.active) {
                throw new ValidationError('Cannot modify questions in an active study');
            }

            const question = await this.questionRepository.findById(questionId);

            if (!question || question.studyId !== studyId) {
                throw ApiError.notFound('Question not found');
            }

            // Validate configuration if being updated
            const finalQuestionType = data.questionType || question.questionType;
            const finalConfiguration = data.configuration
                ? { ...question.configuration, ...data.configuration }
                : question.configuration;

            this.validateQuestionConfiguration(finalQuestionType, finalConfiguration);

            // Handle order index changes
            if (data.orderIndex !== undefined && data.orderIndex !== question.orderIndex) {
                await this.questionRepository.reorderQuestion(questionId, question.orderIndex, data.orderIndex);
            }

            // Update fields
            if (data.questionText !== undefined) question.questionText = data.questionText;
            if (data.questionType !== undefined) question.questionType = data.questionType as any;
            if (data.configuration !== undefined) {
                question.configuration = { ...question.configuration, ...data.configuration };
            }
            if (data.orderIndex !== undefined) question.orderIndex = data.orderIndex;

            return await this.questionRepository.update(question.id, question);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to update question', 500, 'QUESTION_UPDATE_ERROR', error);
        }
    }

    /**
     * Delete a question
     */
    async deleteQuestion(studyId: string, questionId: string, researcherId: string): Promise<void> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to modify this study');
            }

            // Cannot delete questions from active studies
            if (study.active) {
                throw new ValidationError('Cannot delete questions from an active study');
            }

            const question = await this.questionRepository.findById(questionId);

            if (!question || question.studyId !== studyId) {
                throw ApiError.notFound('Question not found');
            }

            // Shift remaining questions down
            await this.questionRepository.shiftQuestionsOrder(studyId, question.orderIndex + 1, -1);

            await this.questionRepository.delete(questionId);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to delete question', 500, 'QUESTION_DELETION_ERROR', error);
        }
    }

    /**
     * Reorder multiple questions at once
     */
    async reorderQuestions(
        studyId: string,
        researcherId: string,
        questionOrders: QuestionOrderUpdate[]
    ): Promise<Question[]> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to modify this study');
            }

            // Cannot reorder questions in active studies
            if (study.active) {
                throw new ValidationError('Cannot reorder questions in an active study');
            }

            // Validate all questions belong to this study
            const questionIds = questionOrders.map(q => q.questionId);
            const questions = await this.questionRepository.findByIds(questionIds);

            for (const question of questions) {
                if (question.studyId !== studyId) {
                    throw ApiError.badRequest(`Question ${question.id} does not belong to this study`);
                }
            }

            // Update order indices
            for (const { questionId, orderIndex } of questionOrders) {
                await this.questionRepository.updateOrderIndex(questionId, orderIndex);
            }

            // Return updated questions
            return await this.questionRepository.findByStudy(studyId);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to reorder questions', 500, 'QUESTION_REORDER_ERROR', error);
        }
    }

    /**
     * Get questions by type
     */
    async getQuestionsByType(studyId: string, researcherId: string, questionType: string): Promise<Question[]> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to view this study');
            }

            // Validate question type
            const validTypes = ['map_drawing', 'heatmap', 'point_selection', 'area_selection', 'audio_response', 'rating', 'demographic'];
            if (!validTypes.includes(questionType)) {
                throw new ValidationError(`Invalid question type: ${questionType}`);
            }

            return await this.questionRepository.findByType(studyId, questionType);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to get questions by type', 500, 'QUESTION_RETRIEVAL_ERROR', error);
        }
    }

    /**
     * Duplicate a question
     */
    async duplicateQuestion(studyId: string, questionId: string, researcherId: string): Promise<Question> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to modify this study');
            }

            // Cannot duplicate questions in active studies
            if (study.active) {
                throw new ValidationError('Cannot duplicate questions in an active study');
            }

            const originalQuestion = await this.questionRepository.findById(questionId);

            if (!originalQuestion || originalQuestion.studyId !== studyId) {
                throw ApiError.notFound('Question not found');
            }

            return await this.questionRepository.duplicateQuestion(questionId, studyId);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to duplicate question', 500, 'QUESTION_DUPLICATION_ERROR', error);
        }
    }

    /**
     * Validate a question configuration
     */
    async validateQuestion(studyId: string, questionId: string, researcherId: string): Promise<{ valid: boolean; errors: string[] }> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to view this study');
            }

            const question = await this.questionRepository.findById(questionId);

            if (!question || question.studyId !== studyId) {
                throw ApiError.notFound('Question not found');
            }

            const errors: string[] = [];

            // Basic validation
            if (!question.questionText || question.questionText.trim().length === 0) {
                errors.push('Question text is required');
            }

            if (question.questionText && question.questionText.length > 2000) {
                errors.push('Question text cannot exceed 2000 characters');
            }

            // Type-specific validation
            try {
                this.validateQuestionConfiguration(question.questionType, question.configuration);
            } catch (validationError) {
                if (validationError instanceof ValidationError) {
                    errors.push(validationError.message);
                }
            }

            // Check for audio stimuli if required
            if (question.questionType === 'audio_response' && question.configuration.audioRequired) {
                const questionWithAudio = await this.questionRepository.findByStudyWithAudio(studyId);
                const questionAudio = questionWithAudio.find(q => q.id === questionId);
                const hasAudio = questionAudio?.audioStimuli?.length && questionAudio.audioStimuli.length > 0;
                if (!hasAudio) {
                    errors.push('Audio stimulus is required for this question type');
                }
            }

            return {
                valid: errors.length === 0,
                errors
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to validate question', 500, 'QUESTION_VALIDATION_ERROR', error);
        }
    }

    /**
     * Get study statistics
     */
    async getStudyStatistics(studyId: string, researcherId: string): Promise<any> {
        try {
            const study = await this.studyRepository.findById(studyId);

            if (!study) {
                throw ApiError.notFound('Study not found');
            }

            if (study.researcherId !== researcherId) {
                throw ApiError.forbidden('You do not have permission to view this study');
            }

            return await this.studyRepository.getStudyStatistics(studyId);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('Failed to get study statistics', 500, 'STATISTICS_ERROR', error);
        }
    }
}