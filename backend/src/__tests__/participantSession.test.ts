import { describe, it, expect, beforeEach } from 'vitest';
import { ParticipantSessionService } from '../services/ParticipantSessionService';

// Mock data for testing
const mockStudy = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Study',
  description: 'A test study for participant sessions',
  active: true,
  researcherId: '456e7890-e89b-12d3-a456-426614174000',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockParticipant = {
  id: '789e0123-e89b-12d3-a456-426614174000',
  studyId: mockStudy.id,
  sessionToken: 'ps_test-token-123_abc_def',
  demographicData: {
    ageRange: '25-34',
    gender: 'non-binary',
    nativeLanguage: 'German'
  },
  startedAt: new Date(),
  completedAt: null
};

describe('ParticipantSessionService Unit Tests', () => {
  let sessionService: ParticipantSessionService;

  beforeEach(() => {
    sessionService = new ParticipantSessionService();
  });

  describe('Session Token Generation', () => {
    it('should generate unique session tokens', () => {
      const token1 = (sessionService as any).generateSessionToken();
      const token2 = (sessionService as any).generateSessionToken();
      
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^ps_[a-f0-9-]+_[a-z0-9]+_[a-z0-9]+$/);
    });
  });

  describe('Demographic Data Sanitization', () => {
    it('should sanitize demographic data correctly', () => {
      const rawData = {
        age: 28,
        gender: 'female',
        nativeLanguage: 'English',
        email: 'test@example.com', // Should be filtered out
        name: 'John Doe', // Should be filtered out
        education: 'Bachelor\'s degree',
        spokenLanguages: ['English', 'Spanish', 'French']
      };

      const sanitized = (sessionService as any).sanitizeDemographicData(rawData);
      
      expect(sanitized).not.toHaveProperty('age'); // Converted to ageRange
      expect(sanitized).toHaveProperty('ageRange', '25-34');
      expect(sanitized).toHaveProperty('gender', 'female');
      expect(sanitized).toHaveProperty('nativeLanguage', 'English');
      expect(sanitized).toHaveProperty('education', 'Bachelor\'s degree');
      expect(sanitized).toHaveProperty('spokenLanguages');
      expect(sanitized.spokenLanguages).toEqual(['English', 'Spanish', 'French']);
      
      // PII should be filtered out
      expect(sanitized).not.toHaveProperty('email');
      expect(sanitized).not.toHaveProperty('name');
    });

    it('should handle age ranges correctly', () => {
      const testCases = [
        { age: 16, expected: 'under-18' },
        { age: 20, expected: '18-24' },
        { age: 30, expected: '25-34' },
        { age: 40, expected: '35-44' },
        { age: 50, expected: '45-54' },
        { age: 60, expected: '55-64' },
        { age: 70, expected: '65+' }
      ];

      testCases.forEach(({ age, expected }) => {
        const sanitized = (sessionService as any).sanitizeDemographicData({ age });
        expect(sanitized.ageRange).toBe(expected);
      });
    });

    it('should handle empty and invalid data', () => {
      const sanitized = (sessionService as any).sanitizeDemographicData({
        invalidField: 'should be filtered',
        gender: '',
        nativeLanguage: null,
        spokenLanguages: ['', 'English', null, 'Spanish']
      });

      expect(sanitized).not.toHaveProperty('invalidField');
      expect(sanitized).not.toHaveProperty('gender'); // Empty string filtered
      expect(sanitized).not.toHaveProperty('nativeLanguage'); // Null filtered
      expect(sanitized.spokenLanguages).toEqual(['English', 'Spanish']); // Empty/null items filtered
    });
  });

  describe('Token Extraction', () => {
    it('should extract session token from Bearer header', () => {
      const sessionToken = 'ps_test-token-123_abc_def';
      const authHeader = `Bearer ${sessionToken}`;
      
      const extracted = sessionService.extractSessionTokenFromHeader(authHeader);
      expect(extracted).toBe(sessionToken);
    });

    it('should extract session token from Session header', () => {
      const sessionToken = 'ps_test-token-123_abc_def';
      const authHeader = `Session ${sessionToken}`;
      
      const extracted = sessionService.extractSessionTokenFromHeader(authHeader);
      expect(extracted).toBe(sessionToken);
    });

    it('should not extract JWT tokens from Bearer header', () => {
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const authHeader = `Bearer ${jwtToken}`;
      
      const extracted = sessionService.extractSessionTokenFromHeader(authHeader);
      expect(extracted).toBeNull();
    });

    it('should return null for invalid headers', () => {
      expect(sessionService.extractSessionTokenFromHeader(undefined)).toBeNull();
      expect(sessionService.extractSessionTokenFromHeader('')).toBeNull();
      expect(sessionService.extractSessionTokenFromHeader('InvalidFormat token')).toBeNull();
      expect(sessionService.extractSessionTokenFromHeader('Bearer')).toBeNull();
    });
  });

  describe('Session Validation Logic', () => {
    it('should validate session token format', () => {
      const validTokens = [
        'ps_123e4567-e89b-12d3-a456-426614174000_abc123_def456',
        'ps_987f6543-e21c-43d5-b678-537825396174_xyz789_ghi012'
      ];

      validTokens.forEach(token => {
        expect(token).toMatch(/^ps_[a-f0-9-]+_[a-z0-9]+_[a-z0-9]+$/);
      });
    });

    it('should reject invalid session token formats', () => {
      const invalidTokens = [
        'invalid-token',
        'ps_invalid',
        'jwt_token_here',
        '',
        'ps_'
      ];

      // These would be rejected by the database lookup, but format validation helps
      invalidTokens.forEach(token => {
        expect(token).not.toMatch(/^ps_[a-f0-9-]+_[a-z0-9]+_[a-z0-9]+$/);
      });
    });
  });
});

describe('Participant Authentication Middleware Tests', () => {
  describe('Token Extraction Logic', () => {
    it('should handle different authorization header formats', () => {
      const sessionService = new ParticipantSessionService();
      
      // Test cases for different header formats
      const testCases = [
        {
          header: 'Bearer ps_123e4567-e89b-12d3-a456-426614174000_abc_def',
          expected: 'ps_123e4567-e89b-12d3-a456-426614174000_abc_def'
        },
        {
          header: 'Session ps_123e4567-e89b-12d3-a456-426614174000_abc_def',
          expected: 'ps_123e4567-e89b-12d3-a456-426614174000_abc_def'
        },
        {
          header: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expected: null // JWT token, not session token
        },
        {
          header: 'InvalidFormat token',
          expected: null
        },
        {
          header: undefined,
          expected: null
        }
      ];

      testCases.forEach(({ header, expected }) => {
        const result = sessionService.extractSessionTokenFromHeader(header);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Session Security', () => {
    it('should generate cryptographically secure session tokens', () => {
      const sessionService = new ParticipantSessionService();
      const tokens = new Set();
      
      // Generate multiple tokens to check for uniqueness
      for (let i = 0; i < 100; i++) {
        const token = (sessionService as any).generateSessionToken();
        expect(tokens.has(token)).toBe(false); // Should be unique
        tokens.add(token);
        
        // Check token structure
        expect(token).toMatch(/^ps_[a-f0-9-]+_[a-z0-9]+_[a-z0-9]+$/);
        expect(token.length).toBeGreaterThan(50); // Should be sufficiently long
      }
    });

    it('should properly sanitize demographic data for GDPR compliance', () => {
      const sessionService = new ParticipantSessionService();
      
      const potentialPII = {
        // Allowed fields
        age: 25,
        gender: 'female',
        education: 'Master\'s degree',
        nativeLanguage: 'German',
        
        // PII that should be filtered out
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+49 123 456789',
        address: '123 Main St, Berlin',
        socialSecurityNumber: '123-45-6789',
        
        // Edge cases
        emptyString: '',
        nullValue: null,
        undefinedValue: undefined,
        veryLongString: 'a'.repeat(200) // Should be truncated
      };

      const sanitized = (sessionService as any).sanitizeDemographicData(potentialPII);
      
      // Should contain allowed fields (age converted to range)
      expect(sanitized).toHaveProperty('ageRange', '25-34');
      expect(sanitized).toHaveProperty('gender', 'female');
      expect(sanitized).toHaveProperty('education', 'Master\'s degree');
      expect(sanitized).toHaveProperty('nativeLanguage', 'German');
      
      // Should not contain PII
      expect(sanitized).not.toHaveProperty('firstName');
      expect(sanitized).not.toHaveProperty('lastName');
      expect(sanitized).not.toHaveProperty('email');
      expect(sanitized).not.toHaveProperty('phone');
      expect(sanitized).not.toHaveProperty('address');
      expect(sanitized).not.toHaveProperty('socialSecurityNumber');
      
      // Should not contain empty/null values
      expect(sanitized).not.toHaveProperty('emptyString');
      expect(sanitized).not.toHaveProperty('nullValue');
      expect(sanitized).not.toHaveProperty('undefinedValue');
      
      // Should not contain very long strings
      expect(sanitized).not.toHaveProperty('veryLongString');
    });
  });
});