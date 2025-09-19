import { describe, it, expect, beforeEach } from 'vitest';
import { StudyService } from '../services/StudyService';
import { ValidationError } from '../types/errors';

describe('Question Management - Validation', () => {
  let studyService: StudyService;

  beforeEach(() => {
    studyService = new StudyService();
  });

  describe('Question Configuration Validation', () => {
    it('should validate map drawing question configuration', () => {
      const validConfig = {
        allowedDrawingTools: ['pen', 'polygon'],
        colors: ['#FF0000', '#00FF00'],
        maxResponses: 5,
        timeLimit: 300,
        required: true
      };

      // This should not throw an error
      expect(() => {
        (studyService as any).validateQuestionConfiguration('map_drawing', validConfig);
      }).not.toThrow();
    });

    it('should validate heatmap question configuration', () => {
      const validConfig = {
        heatmapSettings: {
          radius: 30,
          maxIntensity: 1.5,
          gradient: { '0.0': '#0000FF', '1.0': '#FF0000' }
        },
        intensityScale: {
          min: 0,
          max: 5,
          step: 1,
          labels: ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong']
        }
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('heatmap', validConfig);
      }).not.toThrow();
    });

    it('should validate rating question configuration', () => {
      const validConfig = {
        ratingScale: {
          min: 1,
          max: 7,
          step: 1,
          labels: ['Strongly Disagree', 'Disagree', 'Somewhat Disagree', 'Neutral', 'Somewhat Agree', 'Agree', 'Strongly Agree'],
          scaleType: 'likert'
        },
        ratingAspects: [
          { id: 'pleasantness', label: 'How pleasant does this sound?' },
          { id: 'familiarity', label: 'How familiar is this to you?' }
        ]
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('rating', validConfig);
      }).not.toThrow();
    });

    it('should validate audio response question configuration', () => {
      const validConfig = {
        audioRequired: true,
        allowReplay: true,
        maxReplays: 3,
        responseType: 'point_selection',
        responseConfiguration: {
          maxPoints: 1,
          allowMultiplePoints: false
        }
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('audio_response', validConfig);
      }).not.toThrow();
    });

    it('should reject map drawing question without drawing tools', () => {
      const invalidConfig = {
        colors: ['#FF0000']
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('map_drawing', invalidConfig);
      }).toThrow(ValidationError);
    });

    it('should reject heatmap question without heatmap settings', () => {
      const invalidConfig = {
        timeLimit: 300
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('heatmap', invalidConfig);
      }).toThrow(ValidationError);
    });

    it('should reject rating question without rating aspects', () => {
      const invalidConfig = {
        ratingScale: {
          min: 1,
          max: 5,
          step: 1,
          scaleType: 'likert'
        }
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('rating', invalidConfig);
      }).toThrow(ValidationError);
    });

    it('should reject rating question with invalid scale', () => {
      const invalidConfig = {
        ratingScale: {
          min: 5,
          max: 1, // max should be greater than min
          step: 1,
          scaleType: 'likert'
        },
        ratingAspects: [
          { id: 'test', label: 'Test aspect' }
        ]
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('rating', invalidConfig);
      }).toThrow(ValidationError);
    });

    it('should reject audio response question without response type', () => {
      const invalidConfig = {
        audioRequired: true,
        allowReplay: true
        // missing responseType
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('audio_response', invalidConfig);
      }).toThrow(ValidationError);
    });
  });

});