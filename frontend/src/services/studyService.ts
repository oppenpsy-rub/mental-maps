import { Study } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export interface StudyListOptions {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StudyListResponse {
  studies: Study[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

export interface StudyStatistics {
  totalStudies: number;
  activeStudies: number;
  draftStudies: number;
  completedStudies: number;
  totalResponses: number;
}

class StudyService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || data;
  }

  /**
   * Get studies for the authenticated researcher
   */
  async getStudies(options: StudyListOptions = {}): Promise<StudyListResponse> {
    const queryParams = new URLSearchParams();
    
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.search) queryParams.append('search', options.search);
    if (options.active !== undefined) queryParams.append('active', options.active.toString());
    if (options.sortBy) queryParams.append('sortBy', options.sortBy);
    if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

    const response = await fetch(`${API_BASE_URL}/studies?${queryParams}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      studies: data.data || [],
      pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  }

  /**
   * Get a single study by ID
   */
  async getStudy(studyId: string, includeQuestions = false): Promise<Study> {
    const queryParams = includeQuestions ? '?include=questions' : '';
    
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}${queryParams}`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<Study>(response);
  }

  /**
   * Create a new study
   */
  async createStudy(data: CreateStudyRequest): Promise<Study> {
    const response = await fetch(`${API_BASE_URL}/studies`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    return this.handleResponse<Study>(response);
  }

  /**
   * Update an existing study
   */
  async updateStudy(studyId: string, data: UpdateStudyRequest): Promise<Study> {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    return this.handleResponse<Study>(response);
  }

  /**
   * Delete a study
   */
  async deleteStudy(studyId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Activate a study
   */
  async activateStudy(studyId: string, reason?: string): Promise<Study> {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/activate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason })
    });

    return this.handleResponse<Study>(response);
  }

  /**
   * Deactivate a study
   */
  async deactivateStudy(studyId: string, reason?: string): Promise<Study> {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/deactivate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason })
    });

    return this.handleResponse<Study>(response);
  }

  /**
   * Get study statistics for dashboard
   */
  async getStudyStatistics(): Promise<StudyStatistics> {
    const response = await fetch(`${API_BASE_URL}/studies/statistics`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse<StudyStatistics>(response);
  }

  /**
   * Get study status information
   */
  async getStudyStatus(studyId: string): Promise<{
    currentStatus: string;
    statusHistory: any[];
    validTransitions: string[];
    canActivate: boolean;
    validationErrors: string[];
  }> {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/status`, {
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Create a new question for a study
   */
  async createQuestion(studyId: string, questionData: any): Promise<any> {
    console.log('Creating question:', { studyId, questionData });
    console.log('Auth headers:', this.getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/questions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(questionData)
    });

    console.log('Create question response:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create question error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return this.handleResponse(response);
  }

  /**
   * Update an existing question
   */
  async updateQuestion(studyId: string, questionId: string, questionData: any): Promise<any> {
    console.log('Updating question:', { studyId, questionId, questionData });
    console.log('Auth headers:', this.getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/questions/${questionId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(questionData)
    });

    console.log('Update question response:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update question error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return this.handleResponse(response);
  }

  /**
   * Delete a question
   */
  async deleteQuestion(studyId: string, questionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }

  /**
   * Get all questions for a study
   */
  async getStudyQuestions(studyId: string): Promise<any[]> {
    console.log('Getting questions for study:', studyId);
    console.log('Auth headers:', this.getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/questions`, {
      headers: this.getAuthHeaders()
    });

    console.log('Get questions response:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get questions error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return this.handleResponse(response);
  }

  /**
   * Update question order
   */
  async updateQuestionOrder(studyId: string, questionOrders: { id: string; orderIndex: number }[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/questions/reorder`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ questions: questionOrders })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  }
}

export const studyService = new StudyService();
export default studyService;