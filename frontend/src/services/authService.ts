import axios from 'axios';
import { User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  researcher: User;
  accessToken: string;
  refreshToken: string;
}

export interface ParticipantSessionResponse {
  sessionToken: string;
  studyId: string;
}

class AuthService {
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

    // Handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async createParticipantSession(studyId: string): Promise<ParticipantSessionResponse> {
    const response = await this.api.post('/auth/participant-session', { studyId });
    return response.data;
  }

  async validateToken(): Promise<User> {
    const response = await this.api.get('/auth/me');
    return response.data.researcher;
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}

export const authService = new AuthService();