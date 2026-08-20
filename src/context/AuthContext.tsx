import React, { createContext, useState, useEffect, useContext, ReactNode, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  managedModules?: string[];
}

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: (shouldNavigate?: boolean, reason?: string) => void;
  loading: boolean;
  isAuthenticated: boolean;
  resetInactivityTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT_MS = 28 * 60 * 1000;    // 28 minutes (Warning appears 2 min before logout)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Inactivity & Warning State
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const [inactivityMessage, setInactivityMessage] = useState<string | null>(null);

  const lastActivityRef = useRef<number>(Date.now());
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const navigate = useNavigate();

  // Helper to logout
  const logout = useCallback((shouldNavigate: boolean = true, reason?: string) => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setShowWarningModal(false);

    // Broadcast to all other tabs
    try {
      broadcastChannelRef.current?.postMessage({ type: 'LOGOUT' });
    } catch (e) {
      // Ignore
    }

    if (reason) {
      setInactivityMessage(reason);
      setTimeout(() => setInactivityMessage(null), 8000);
    }

    if (shouldNavigate) {
      navigate('/');
    }
  }, [navigate]);

  // Reset activity timestamp
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarningModal) {
      setShowWarningModal(false);
    }
  }, [showWarningModal]);

  // 1. INITIALIZE BROADCAST CHANNEL & STORAGE LISTENER FOR INTER-TAB SYNC
  useEffect(() => {
    // BroadcastChannel API for multi-tab sync
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('lyre_auth_sync');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          console.log('[AuthContext] Received LOGOUT signal from another tab');
          setCurrentUser(null);
          setToken(null);
          setShowWarningModal(false);
          navigate('/');
        } else if (event.data?.type === 'LOGIN') {
          console.log('[AuthContext] Received LOGIN signal from another tab');
          const storedUser = localStorage.getItem('user');
          const storedToken = localStorage.getItem('token');
          if (storedUser && storedToken) {
            setToken(storedToken);
            setCurrentUser(JSON.parse(storedUser));
          }
        }
      };
    }

    // Fallback: Storage Event Listener for cross-tab localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          // Token removed in another tab -> Logout this tab
          console.log('[AuthContext] Token removed in another tab, logging out');
          setCurrentUser(null);
          setToken(null);
          setShowWarningModal(false);
          navigate('/');
        } else {
          // Token changed in another tab -> Sync user
          console.log('[AuthContext] Token updated in another tab, syncing user');
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setToken(e.newValue);
            setCurrentUser(JSON.parse(storedUser));
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      broadcastChannelRef.current?.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  // 2. INITIALIZE AUTH ON MOUNT
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        setToken(storedToken);
        setCurrentUser(JSON.parse(storedUser));

        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });

          if (!response.ok) {
            throw new Error('Token invalid');
          }
        } catch (error) {
          console.error("Session expired or invalid:", error);
          logout(true);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [logout]);

  // 3. LISTEN FOR USER ACTIVITY (Mouse, Keyboard, Scroll, Touch)
  useEffect(() => {
    if (!token) return;

    let throttleTimer: any = null;
    const handleUserActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
          // Only update activity if warning modal is not currently open
          if (!showWarningModal) {
            lastActivityRef.current = Date.now();
          }
        }, 1000);
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer);
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
    };
  }, [token, showWarningModal]);

  // 4. INACTIVITY CHECKER INTERVAL (Runs every second when logged in)
  useEffect(() => {
    if (!token) {
      setShowWarningModal(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        console.log('[AuthContext] 30 minutes of inactivity reached. Logging out.');
        logout(true, "Vous avez été déconnecté suite à une période d'inactivité de 30 minutes pour votre sécurité.");
      } else if (elapsed >= WARNING_TIMEOUT_MS) {
        const remainingMs = INACTIVITY_TIMEOUT_MS - elapsed;
        const secs = Math.max(0, Math.ceil(remainingMs / 1000));
        setSecondsRemaining(secs);
        setShowWarningModal(true);
      } else {
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token, logout, showWarningModal]);

  // Login handler
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Échec de la connexion';
        const bodyText = await response.text().catch(() => '');
        try {
          const errorData = JSON.parse(bodyText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = bodyText || `Erreur serveur (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const { user, token } = await response.json();

      setCurrentUser(user);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      lastActivityRef.current = Date.now();
      setShowWarningModal(false);

      // Notify other tabs
      try {
        broadcastChannelRef.current?.postMessage({ type: 'LOGIN' });
      } catch (e) {
        // Ignore
      }

      navigate('/dashboard');

    } catch (error) {
      console.error("[AuthContext.tsx] An error occurred in login function:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!token,
    resetInactivityTimer,
  };

  // Format seconds mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}

      {/* Floating Inactivity Toast Banner if just logged out */}
      {inactivityMessage && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-amber-500 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-amber-400">
          <ShieldAlert className="w-6 h-6 flex-shrink-0" />
          <p className="text-sm font-semibold leading-snug">{inactivityMessage}</p>
        </div>
      )}

      {/* 2026 Sleek Inactivity Warning Modal (2 min before timeout) */}
      {showWarningModal && token && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Session bientôt expirée</h3>
                <p className="text-xs font-semibold text-amber-700">Inactivité détectée</p>
              </div>
            </div>

            <div className="space-y-3 text-center">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Pour votre sécurité, votre session sera fermée en raison d'une période d'inactivité de 30 minutes.
              </p>

              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-900 font-mono font-bold text-lg">
                <span>Temps restant :</span>
                <span className="text-amber-600">{formatTime(secondsRemaining)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={resetInactivityTimer}
                className="w-full sm:flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Je reste connecté</span>
              </button>
              <button
                onClick={() => logout(true, "Déconnexion effectuée.")}
                className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
