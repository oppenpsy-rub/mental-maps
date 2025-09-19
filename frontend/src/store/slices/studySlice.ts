import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Study } from '../../types';

interface StudyState {
  studies: Study[];
  currentStudy: Study | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StudyState = {
  studies: [],
  currentStudy: null,
  isLoading: false,
  error: null,
};

const studySlice = createSlice({
  name: 'studies',
  initialState,
  reducers: {
    fetchStudiesStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchStudiesSuccess: (state, action: PayloadAction<Study[]>) => {
      state.studies = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    fetchStudiesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setCurrentStudy: (state, action: PayloadAction<Study>) => {
      state.currentStudy = action.payload;
    },
    clearCurrentStudy: (state) => {
      state.currentStudy = null;
    },
    addStudy: (state, action: PayloadAction<Study>) => {
      state.studies.push(action.payload);
    },
    updateStudy: (state, action: PayloadAction<Study>) => {
      const index = state.studies.findIndex(study => study.id === action.payload.id);
      if (index !== -1) {
        state.studies[index] = action.payload;
      }
      if (state.currentStudy?.id === action.payload.id) {
        state.currentStudy = action.payload;
      }
    },
    removeStudy: (state, action: PayloadAction<string>) => {
      state.studies = state.studies.filter(study => study.id !== action.payload);
      if (state.currentStudy?.id === action.payload) {
        state.currentStudy = null;
      }
    },
  },
});

export const {
  fetchStudiesStart,
  fetchStudiesSuccess,
  fetchStudiesFailure,
  setCurrentStudy,
  clearCurrentStudy,
  addStudy,
  updateStudy,
  removeStudy,
} = studySlice.actions;

export default studySlice.reducer;