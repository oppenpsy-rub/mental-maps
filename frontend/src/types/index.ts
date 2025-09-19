// Core types for the application
export interface User {
  id: string;
  email: string;
  name: string;
  institution?: string;
  role: 'researcher' | 'participant';
}

export interface Study {
  id: string;
  researcherId: string;
  title: string;
  description: string;
  active: boolean;
  status: 'draft' | 'ready' | 'active' | 'paused' | 'completed' | 'archived';
  settings?: any;
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  deactivatedAt?: string;
  statusHistory?: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  reason?: string;
  changedBy: string;
}

export interface Question {
  id: string;
  studyId: string;
  questionText: string;
  questionType: 'map_drawing' | 'audio_response' | 'demographic' | 'heatmap' | 'point_selection' | 'area_selection' | 'rating';
  orderIndex: number;
  configuration?: any;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AppState {
  auth: AuthState;
  studies: Study[];
  currentStudy: Study | null;
  isLoading: boolean;
  error: string | null;
}