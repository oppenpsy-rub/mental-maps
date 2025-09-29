import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import i18n from './i18n';

// Auth Context erstellen
const AuthContext = createContext();

// Auth Provider Component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Token validieren
  const validateToken = async (token) => {
    try {
      // Setze den Token für alle zukünftigen Anfragen
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Benutzerinformationen abrufen
      const response = await axios.get('/api/auth/me');
      const user = response.data;
      setCurrentUser(user);
      
      // Set language from user preference
      if (user.language && user.language !== i18n.language) {
        i18n.changeLanguage(user.language);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Token validation error:', error);
      // Bei Fehler Token löschen und Benutzer ausloggen
      logout();
      setLoading(false);
    }
  };

  // Beim ersten Laden prüfen, ob ein Token existiert
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Token validieren und Benutzerinformationen laden
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Login-Funktion
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Token speichern
      localStorage.setItem('auth_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Benutzer setzen
      setCurrentUser(user);
      
      // Set language from user preference
      if (user.language && user.language !== i18n.language) {
        i18n.changeLanguage(user.language);
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login fehlgeschlagen');
      return false;
    }
  };

  // Registrierungs-Funktion
  const register = async (name, email, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/register', { name, email, password });
      const { token, user } = response.data;
      
      // Token speichern
      localStorage.setItem('auth_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Benutzer setzen
      setCurrentUser(user);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registrierung fehlgeschlagen');
      return false;
    }
  };

  // Logout-Funktion
  const logout = async () => {
    try {
      // Prüfen ob ein Token vorhanden ist
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Optional: Server-seitige Logout-Bestätigung nur wenn Token vorhanden
        await axios.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Auch bei Serverfehler lokalen Logout durchführen
      // 401 Fehler sind normal wenn Token bereits abgelaufen ist
    } finally {
      // Lokalen Logout immer durchführen
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      setCurrentUser(null);
    }
  };

  // Context-Wert
  const value = {
    currentUser,
    setCurrentUser,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook für einfachen Zugriff auf den Auth Context
export function useAuth() {
  return useContext(AuthContext);
}