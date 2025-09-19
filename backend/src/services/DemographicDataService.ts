import { Participant } from '../models/Participant';
import { Response } from '../models/Response';
import { ParticipantRepository } from '../repositories/ParticipantRepository';
import { ResponseRepository } from '../repositories/ResponseRepository';
import { ApiError, ValidationError } from '../types/errors';
import { DemographicData } from '../models/Participant';

export interface DemographicDataValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: DemographicData;
}

export interface DemographicStatistics {
  totalParticipants: number;
  ageDistribution: Record<string, number>;
  genderDistribution: Record<string, number>;
  educationDistribution: Record<string, number>;
  languageDistribution: Record<string, number>;
  geographicDistribution: {
    birthPlaces: Array<{ coordinates: [number, number]; count: number }>;
    currentResidences: Array<{ coordinates: [number, number]; count: number }>;
  };
}

export interface DemographicExportData {
  participantId: string;
  studyId: string;
  demographicData: DemographicData;
  responseCount: number;
  completionStatus: 'completed' | 'partial' | 'not_started';
  startedAt: Date;
  completedAt?: Date;
}

export class DemographicDataService {
  private participantRepository: ParticipantRepository;
  private responseRepository: ResponseRepository;

  constructor() {
    this.participantRepository = new ParticipantRepository();
    this.responseRepository = new ResponseRepository();
  }

  /**
   * Validate and sanitize demographic data
   */
  validateAndSanitizeDemographicData(data: Record<string, any>): DemographicDataValidationResult {
    const errors: string[] = [];
    const sanitized: DemographicData = {};

    try {
      // Age validation and conversion to range
      if (data.age !== undefined) {
        const age = Number(data.age);
        if (isNaN(age) || age < 16 || age > 120) {
          errors.push('Age must be between 16 and 120 years');
        } else {
          // Convert to age range for privacy
          if (age < 18) sanitized.ageRange = 'under-18';
          else if (age < 25) sanitized.ageRange = '18-24';
          else if (age < 35) sanitized.ageRange = '25-34';
          else if (age < 45) sanitized.ageRange = '35-44';
          else if (age < 55) sanitized.ageRange = '45-54';
          else if (age < 65) sanitized.ageRange = '55-64';
          else sanitized.ageRange = '65+';
        }
      }

      // Gender validation
      if (data.gender !== undefined && data.gender !== null && data.gender !== '') {
        const gender = String(data.gender).trim();
        if (gender.length > 0 && gender.length <= 50) {
          sanitized.gender = gender;
        } else {
          errors.push('Gender must be between 1 and 50 characters');
        }
      }

      // Education validation
      if (data.education !== undefined && data.education !== null && data.education !== '') {
        const validEducationLevels = [
          'primary', 'secondary', 'high_school', 'vocational', 
          'bachelor', 'master', 'doctorate', 'other'
        ];
        if (validEducationLevels.includes(data.education)) {
          sanitized.education = data.education;
        } else {
          errors.push('Invalid education level');
        }
      }

      // Occupation validation
      if (data.occupation !== undefined && data.occupation !== null && data.occupation !== '') {
        const occupation = String(data.occupation).trim();
        if (occupation.length > 0 && occupation.length <= 100) {
          sanitized.occupation = occupation;
        } else {
          errors.push('Occupation must be between 1 and 100 characters');
        }
      }

      // Native language validation
      if (data.nativeLanguage !== undefined && data.nativeLanguage !== null && data.nativeLanguage !== '') {
        const nativeLanguage = String(data.nativeLanguage).trim();
        if (nativeLanguage.length > 0 && nativeLanguage.length <= 50) {
          sanitized.nativeLanguage = nativeLanguage;
        } else {
          errors.push('Native language must be between 1 and 50 characters');
        }
      }

      // Other languages validation
      if (data.otherLanguages && Array.isArray(data.otherLanguages)) {
        const validLanguages = data.otherLanguages
          .filter(lang => typeof lang === 'string' && lang.trim().length > 0)
          .map(lang => lang.trim().substring(0, 50))
          .slice(0, 10); // Limit to 10 languages
        
        if (validLanguages.length > 0) {
          sanitized.otherLanguages = validLanguages;
        }
      }

      // Birth place validation
      if (data.birthPlace && typeof data.birthPlace === 'object') {
        const birthPlace = this.validateLocationData(data.birthPlace);
        if (birthPlace.isValid) {
          sanitized.birthPlace = birthPlace.location;
        } else {
          errors.push(...birthPlace.errors.map(err => `Birth place: ${err}`));
        }
      }

      // Current residence validation
      if (data.currentResidence && typeof data.currentResidence === 'object') {
        const currentResidence = this.validateLocationData(data.currentResidence);
        if (currentResidence.isValid) {
          sanitized.currentResidence = currentResidence.location;
        } else {
          errors.push(...currentResidence.errors.map(err => `Current residence: ${err}`));
        }
      }

      // Dialect background validation
      if (data.dialectBackground !== undefined && data.dialectBackground !== null && data.dialectBackground !== '') {
        const dialectBackground = String(data.dialectBackground).trim();
        if (dialectBackground.length > 0 && dialectBackground.length <= 100) {
          sanitized.dialectBackground = dialectBackground;
        } else {
          errors.push('Dialect background must be between 1 and 100 characters');
        }
      }

      // Language exposure validation
      if (data.languageExposure && Array.isArray(data.languageExposure)) {
        const validExposures = [];
        
        for (let i = 0; i < Math.min(data.languageExposure.length, 20); i++) {
          const exposure = data.languageExposure[i];
          const exposureErrors = this.validateLanguageExposure(exposure, i + 1);
          
          if (exposureErrors.length === 0) {
            validExposures.push({
              language: exposure.language.trim(),
              proficiency: exposure.proficiency,
              yearsOfExposure: exposure.yearsOfExposure
            });
          } else {
            errors.push(...exposureErrors);
          }
        }
        
        if (validExposures.length > 0) {
          sanitized.languageExposure = validExposures;
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitized : undefined
      };

    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid demographic data format']
      };
    }
  }

  /**
   * Update participant demographic data with validation and anonymization
   */
  async updateParticipantDemographicData(
    participantId: string, 
    demographicData: Record<string, any>
  ): Promise<Participant> {
    // Validate and sanitize data
    const validation = this.validateAndSanitizeDemographicData(demographicData);
    
    if (!validation.isValid) {
      throw new ValidationError('Invalid demographic data', validation.errors);
    }

    // Get existing participant
    const participant = await this.participantRepository.findById(participantId);
    if (!participant) {
      throw ApiError.notFound('Participant not found');
    }

    // Merge with existing demographic data
    const updatedDemographicData = {
      ...participant.demographicData,
      ...validation.sanitizedData
    };

    // Update participant
    return await this.participantRepository.update(participantId, {
      demographicData: updatedDemographicData
    });
  }

  /**
   * Get anonymized demographic statistics for a study
   */
  async getDemographicStatistics(studyId: string): Promise<DemographicStatistics> {
    const participants = await this.participantRepository.findByStudyId(studyId);
    
    const stats: DemographicStatistics = {
      totalParticipants: participants.length,
      ageDistribution: {},
      genderDistribution: {},
      educationDistribution: {},
      languageDistribution: {},
      geographicDistribution: {
        birthPlaces: [],
        currentResidences: []
      }
    };

    // Process each participant's demographic data
    participants.forEach(participant => {
      const demo = participant.demographicData;
      
      if (!demo) return;

      // Age distribution (using age ranges for privacy)
      if (demo.ageRange) {
        stats.ageDistribution[demo.ageRange] = (stats.ageDistribution[demo.ageRange] || 0) + 1;
      }

      // Gender distribution
      if (demo.gender) {
        stats.genderDistribution[demo.gender] = (stats.genderDistribution[demo.gender] || 0) + 1;
      }

      // Education distribution
      if (demo.education) {
        stats.educationDistribution[demo.education] = (stats.educationDistribution[demo.education] || 0) + 1;
      }

      // Language distribution
      if (demo.nativeLanguage) {
        stats.languageDistribution[demo.nativeLanguage] = (stats.languageDistribution[demo.nativeLanguage] || 0) + 1;
      }

      if (demo.otherLanguages) {
        demo.otherLanguages.forEach(lang => {
          stats.languageDistribution[lang] = (stats.languageDistribution[lang] || 0) + 1;
        });
      }

      // Geographic distribution (anonymized by rounding coordinates)
      if (demo.birthPlace?.coordinates) {
        const [lng, lat] = demo.birthPlace.coordinates;
        const roundedCoords: [number, number] = [
          Math.round(lng * 100) / 100, // Round to 2 decimal places
          Math.round(lat * 100) / 100
        ];
        
        const existing = stats.geographicDistribution.birthPlaces.find(
          place => place.coordinates[0] === roundedCoords[0] && place.coordinates[1] === roundedCoords[1]
        );
        
        if (existing) {
          existing.count++;
        } else {
          stats.geographicDistribution.birthPlaces.push({
            coordinates: roundedCoords,
            count: 1
          });
        }
      }

      if (demo.currentResidence?.coordinates) {
        const [lng, lat] = demo.currentResidence.coordinates;
        const roundedCoords: [number, number] = [
          Math.round(lng * 100) / 100,
          Math.round(lat * 100) / 100
        ];
        
        const existing = stats.geographicDistribution.currentResidences.find(
          place => place.coordinates[0] === roundedCoords[0] && place.coordinates[1] === roundedCoords[1]
        );
        
        if (existing) {
          existing.count++;
        } else {
          stats.geographicDistribution.currentResidences.push({
            coordinates: roundedCoords,
            count: 1
          });
        }
      }
    });

    return stats;
  }

  /**
   * Export demographic data for analysis
   */
  async exportDemographicData(studyId: string): Promise<DemographicExportData[]> {
    const participants = await this.participantRepository.findByStudyId(studyId);
    const exportData: DemographicExportData[] = [];

    for (const participant of participants) {
      // Get response count for this participant
      const responses = await this.responseRepository.findByParticipant(participant.id);
      
      const completionStatus: 'completed' | 'partial' | 'not_started' = 
        participant.completedAt ? 'completed' :
        responses.length > 0 ? 'partial' : 'not_started';

      exportData.push({
        participantId: participant.id,
        studyId: participant.studyId,
        demographicData: participant.demographicData,
        responseCount: responses.length,
        completionStatus,
        startedAt: participant.startedAt,
        completedAt: participant.completedAt
      });
    }

    return exportData;
  }

  /**
   * Link demographic data to responses for analysis while maintaining anonymity
   */
  async linkDemographicDataToResponses(studyId: string): Promise<Array<{
    responseId: string;
    demographicData: DemographicData;
    responseData: any;
    createdAt: Date;
  }>> {
    const participants = await this.participantRepository.findByStudyId(studyId);
    const linkedData = [];

    for (const participant of participants) {
      const responses = await this.responseRepository.findByParticipant(participant.id);
      
      for (const response of responses) {
        linkedData.push({
          responseId: response.id,
          demographicData: participant.demographicData,
          responseData: response.responseData,
          createdAt: response.createdAt
        });
      }
    }

    return linkedData;
  }

  /**
   * Validate location data
   */
  private validateLocationData(location: any): {
    isValid: boolean;
    errors: string[];
    location?: any;
  } {
    const errors: string[] = [];
    const validatedLocation: any = {};

    // City validation
    if (location.city !== undefined && location.city !== null && location.city !== '') {
      const city = String(location.city).trim();
      if (city.length > 0 && city.length <= 100) {
        validatedLocation.city = city;
      } else {
        errors.push('City must be between 1 and 100 characters');
      }
    }

    // Region validation
    if (location.region !== undefined && location.region !== null && location.region !== '') {
      const region = String(location.region).trim();
      if (region.length > 0 && region.length <= 100) {
        validatedLocation.region = region;
      } else {
        errors.push('Region must be between 1 and 100 characters');
      }
    }

    // Country validation
    if (location.country !== undefined && location.country !== null && location.country !== '') {
      const country = String(location.country).trim();
      if (country.length > 0 && country.length <= 100) {
        validatedLocation.country = country;
      } else {
        errors.push('Country must be between 1 and 100 characters');
      }
    }

    // Coordinates validation
    if (location.coordinates && Array.isArray(location.coordinates)) {
      const [lng, lat] = location.coordinates;
      if (typeof lng === 'number' && typeof lat === 'number') {
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          validatedLocation.coordinates = [lng, lat];
        } else {
          errors.push('Invalid coordinates range');
        }
      } else {
        errors.push('Coordinates must be numbers');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      location: errors.length === 0 ? validatedLocation : undefined
    };
  }

  /**
   * Validate language exposure data
   */
  private validateLanguageExposure(exposure: any, index: number): string[] {
    const errors: string[] = [];

    if (!exposure || typeof exposure !== 'object') {
      errors.push(`Language ${index}: Invalid format`);
      return errors;
    }

    // Language name validation
    if (!exposure.language || typeof exposure.language !== 'string' || exposure.language.trim().length === 0) {
      errors.push(`Language ${index}: Language name is required`);
    } else if (exposure.language.trim().length > 50) {
      errors.push(`Language ${index}: Language name must be 50 characters or less`);
    }

    // Proficiency validation
    const validProficiencies = ['basic', 'intermediate', 'advanced', 'native'];
    if (!exposure.proficiency || !validProficiencies.includes(exposure.proficiency)) {
      errors.push(`Language ${index}: Invalid proficiency level`);
    }

    // Years of exposure validation
    if (exposure.yearsOfExposure !== undefined) {
      const years = Number(exposure.yearsOfExposure);
      if (isNaN(years) || years < 0 || years > 100) {
        errors.push(`Language ${index}: Years of exposure must be between 0 and 100`);
      }
    }

    return errors;
  }
}