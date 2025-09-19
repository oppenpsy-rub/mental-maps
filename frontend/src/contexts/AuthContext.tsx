import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { loginSuccess, loginFailure } from '../store/slices/authSlice';
import { authService } from '../services/authService';

interface AuthContextType {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isInitialized: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { } = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for token in localStorage first
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          const user = await authService.validateToken();
          dispatch(loginSuccess({ 
            user: {
              ...user,
              role: 'researcher' as const
            }, 
            token: storedToken 
          }));
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          dispatch(loginFailure());
        }
      } else {
        // No token found, user is not authenticated
        dispatch(loginFailure());
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, [dispatch]); // Remove token dependency to avoid infinite loops

  const value: AuthContextType = {
    isInitialized,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};