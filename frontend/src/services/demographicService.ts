import axios from 'axios';
import { DemographicFormData } from '../components/Forms/DemographicForm';

export interface DemographicData {
  age?: number;
  gender?: string;
  education?: string;
  occupation?: string;
  nativeLanguage?: string;
  otherLanguages?: string[];
  birthPlace?: {
    city?: string;
    region?: string;
    country?: string;
    coordinates?: [number, number];
  };
  currentResidence?: {
    city?: string;
    region?: string;
    country?: string;
    coordinates?: [number, number];
  };
  dialectBackground?: string;
  languageExposure?: {
    language: string;
    proficiency: 'basic' | 'intermediate' | 'advanced' | 'native';
    yearsOfExposure?: number;
  }[];
}

export interface UpdateDemographicDataRequest {
  demographicData: DemographicData;
}

export interface UpdateDemographicDataResponse {
  success: boolean;
  participant: {
    id: string;
    demographicData: DemographicData;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export class DemographicService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
  /**
   * Update demographic data for the current participant session
   */
  async updateDemographicData(data: DemographicFormData): Promise<UpdateDemographicDataResponse> {
    const response = await this.api.put<UpdateDemographicDataResponse>(
      '/auth/participant/demographic',
      { demographicData: data }
    );
    return response.data;
  }

  /**
   * Get current demographic data for the participant session
   */
  async getDemographicData(): Promise<DemographicData> {
    const response = await this.api.get<{ demographicData: DemographicData }>('/auth/participant/session');
    return response.data.demographicData;
  }

  /**
   * Validate demographic data before submission
   */
  validateDemographicData(data: DemographicFormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Age validation
    if (data.age !== undefined && (data.age < 16 || data.age > 120)) {
      errors.push('Alter muss zwischen 16 und 120 Jahren liegen');
    }

    // Language exposure validation
    if (data.languageExposure) {
      data.languageExposure.forEach((lang, index) => {
        if (!lang.language || lang.language.trim().length === 0) {
          errors.push(`Sprache ${index + 1}: Sprachname ist erforderlich`);
        }
        if (lang.yearsOfExposure !== undefined && (lang.yearsOfExposure < 0 || lang.yearsOfExposure > 100)) {
          errors.push(`Sprache ${index + 1}: Jahre der Erfahrung müssen zwischen 0 und 100 liegen`);
        }
      });
    }

    // Coordinates validation
    if (data.birthPlace?.coordinates) {
      const [lng, lat] = data.birthPlace.coordinates;
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        errors.push('Geburtsort: Ungültige Koordinaten');
      }
    }

    if (data.currentResidence?.coordinates) {
      const [lng, lat] = data.currentResidence.coordinates;
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        errors.push('Aktueller Wohnort: Ungültige Koordinaten');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform form data to API format
   */
  transformFormDataToApiFormat(data: DemographicFormData): DemographicData {
    return {
      ...data,
      // Filter out empty strings and arrays
      otherLanguages: data.otherLanguages?.filter(lang => lang && lang.trim().length > 0),
      languageExposure: data.languageExposure?.filter(lang => 
        lang.language && lang.language.trim().length > 0
      )
    };
  }

  /**
   * Transform API data to form format
   */
  transformApiDataToFormFormat(data: DemographicData): DemographicFormData {
    return {
      ...data,
      // Ensure arrays exist
      otherLanguages: data.otherLanguages || [],
      languageExposure: data.languageExposure || []
    };
  }

  /**
   * Get demographic statistics for analysis (researcher use)
   */
  async getDemographicStatistics(studyId: string): Promise<{
    totalParticipants: number;
    ageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    educationDistribution: Record<string, number>;
    languageDistribution: Record<string, number>;
    geographicDistribution: {
      birthPlaces: Array<{ coordinates: [number, number]; count: number }>;
      currentResidences: Array<{ coordinates: [number, number]; count: number }>;
    };
  }> {
    const response = await this.api.get(`/studies/${studyId}/demographics/statistics`);
    return response.data;
  }

  /**
   * Export demographic data for a study
   */
  async exportDemographicData(studyId: string, format: 'json' | 'csv'): Promise<Blob> {
    const response = await this.api.get(`/studies/${studyId}/demographics/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }
}

export const demographicService = new DemographicService();