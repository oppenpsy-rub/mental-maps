import { describe, it, expect, beforeEach } from 'vitest';
import { StudyService } from '../services/StudyService';
import { ValidationError } from '../types/errors';

describe('Question Management - Enhanced Validation Demo', () => {
  let studyService: StudyService;

  beforeEach(() => {
    studyService = new StudyService();
  });

  describe('Map Drawing Questions', () => {
    it('should accept valid map drawing configuration', () => {
      const config = {
        allowedDrawingTools: ['pen', 'polygon', 'circle'],
        colors: ['#FF0000', '#00FF00', '#0000FF'],
        maxResponses: 5,
        timeLimit: 300
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('map_drawing', config);
      }).not.toThrow();
    });

    it('should reject map drawing without tools', () => {
      const config = {
        colors: ['#FF0000']
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('map_drawing', config);
      }).toThrow('Map drawing questions must specify at least one allowed drawing tool');
    });
  });

  describe('Heatmap Questions', () => {
    it('should accept valid heatmap configuration', () => {
      const config = {
        heatmapSettings: {
          radius: 25,
          maxIntensity: 1.0,
          gradient: { '0.0': '#0000FF', '1.0': '#FF0000' }
        },
        intensityScale: {
          min: 0,
          max: 5,
          step: 1,
          labels: ['None', 'Weak', 'Moderate', 'Strong', 'Very Strong']
        }
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('heatmap', config);
      }).not.toThrow();
    });

    it('should reject heatmap without settings', () => {
      const config = {
        timeLimit: 300
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('heatmap', config);
      }).toThrow('Heatmap questions must specify heatmap settings');
    });
  });

  describe('Rating Questions', () => {
    it('should accept valid rating configuration', () => {
      const config = {
        ratingScale: {
          min: 1,
          max: 7,
          step: 1,
          scaleType: 'likert'
        },
        ratingAspects: [
          { id: 'pleasantness', label: 'How pleasant does this sound?' },
          { id: 'familiarity', label: 'How familiar is this to you?' },
          { id: 'correctness', label: 'How correct does this sound?' }
        ]
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('rating', config);
      }).not.toThrow();
    });

    it('should reject rating without aspects', () => {
      const config = {
        ratingScale: {
          min: 1,
          max: 5,
          step: 1,
          scaleType: 'likert'
        }
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('rating', config);
      }).toThrow('Rating questions must specify at least one rating aspect');
    });

    it('should reject invalid rating scale', () => {
      const config = {
        ratingScale: {
          min: 5,
          max: 1, // Invalid: max should be greater than min
          step: 1,
          scaleType: 'likert'
        },
        ratingAspects: [
          { id: 'test', label: 'Test aspect' }
        ]
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('rating', config);
      }).toThrow('Rating scale minimum must be less than maximum');
    });
  });

  describe('Point Selection Questions', () => {
    it('should accept valid point selection configuration', () => {
      const config = {
        maxPoints: 3,
        allowMultiplePoints: true,
        pointCategories: [
          { id: 'dialect1', label: 'Northern Dialect', color: '#FF0000' },
          { id: 'dialect2', label: 'Southern Dialect', color: '#00FF00' }
        ]
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('point_selection', config);
      }).not.toThrow();
    });

    it('should reject invalid max points', () => {
      const config = {
        maxPoints: 0 // Invalid
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('point_selection', config);
      }).toThrow('Point selection questions must allow at least 1 point');
    });
  });

  describe('Area Selection Questions', () => {
    it('should accept valid area selection configuration', () => {
      const config = {
        maxAreas: 2,
        allowOverlapping: false,
        areaCategories: [
          { id: 'region1', label: 'Strong Dialect Region', color: '#FF0000', fillOpacity: 0.5 },
          { id: 'region2', label: 'Weak Dialect Region', color: '#0000FF', fillOpacity: 0.3 }
        ]
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('area_selection', config);
      }).not.toThrow();
    });

    it('should reject invalid max areas', () => {
      const config = {
        maxAreas: 0 // Invalid
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('area_selection', config);
      }).toThrow('Area selection questions must allow at least 1 area');
    });
  });

  describe('Audio Response Questions', () => {
    it('should accept valid audio response configuration', () => {
      const config = {
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
        (studyService as any).validateQuestionConfiguration('audio_response', config);
      }).not.toThrow();
    });

    it('should reject audio response without response type', () => {
      const config = {
        audioRequired: true,
        allowReplay: true
        // Missing responseType
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('audio_response', config);
      }).toThrow('Audio response questions must specify a response type');
    });

    it('should validate nested response configuration', () => {
      const config = {
        audioRequired: true,
        responseType: 'rating',
        responseConfiguration: {
          ratingScale: {
            min: 5, // Invalid: min > max
            max: 1,
            step: 1,
            scaleType: 'likert'
          },
          ratingAspects: [
            { id: 'test', label: 'Test' }
          ]
        }
      };

      expect(() => {
        (studyService as any).validateQuestionConfiguration('audio_response', config);
      }).toThrow('Rating scale minimum must be less than maximum');
    });
  });
});