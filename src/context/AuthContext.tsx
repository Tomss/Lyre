import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// Interface pour l'objet utilisateur que nous attendons de notre backend
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  managedModules?: string[];
}

// Interface pour le contexte d'authentification
interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// URL de notre API backend
import { API_URL } from '../config';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        setToken(storedToken);
        // Optimistically set user
        setCurrentUser(JSON.parse(storedUser));

        try {
          // Verify with backend
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });

          if (!response.ok) {
            throw new Error('Token invalid');
          }
          // If ok, we are good. Maybe update user data if we returned full profile.
        } catch (error) {
          console.error("Session expired or invalid:", error);
          logout(); // This clears localStorage and state
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('[AuthContext.tsx] login function called');
    setLoading(true);
    try {
      console.log(`[AuthContext.tsx] Fetching ${API_URL}/auth/login`);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      console.log(`[AuthContext.tsx] Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AuthContext.tsx] Login API error:', errorData);
        throw new Error(errorData.message || 'Failed to login');
      }

      const { user, token } = await response.json();
      console.log('[AuthContext.tsx] Login successful, received user and token:', { user, token });

      setCurrentUser(user);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      console.log('[AuthContext.tsx] Navigating to /dashboard');
      navigate('/dashboard');

    } catch (error) {
      console.error("[AuthContext.tsx] An error occurred in login function:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const value = {
    currentUser,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!token, // L'utilisateur est authentifié si un token est présent
  };

  // Ne rend les enfants que lorsque le chargement initial est terminé
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// Hook pour utiliser facilement le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
