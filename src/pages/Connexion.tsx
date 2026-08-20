import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  X, 
  CheckCircle2, 
  KeyRound 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Connexion = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { login } = useAuth();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error('[Connexion.tsx] Login failed:', err);
      const msg = err.message || 'Une erreur est survenue lors de la connexion.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetStatus(null);

    try {
      const response = await fetch(`${API_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();
      if (response.ok) {
        setResetStatus({
          type: 'success',
          message: data.message || 'Si cette adresse existe, un lien de réinitialisation vous a été envoyé.'
        });
        setResetEmail('');
      } else {
        setResetStatus({
          type: 'error',
          message: data.message || 'Impossible de traiter la demande.'
        });
      }
    } catch (err) {
      setResetStatus({
        type: 'error',
        message: 'Une erreur réseau est survenue.'
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="pt-10 pb-24 bg-slate-50 min-h-[calc(100vh-140px)] flex items-center justify-center px-4 sm:px-6">
      
      <div className="w-full max-w-md">
        
        {/* Title Header */}
        <div className="text-center mb-8">
          <h1 className="font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight mb-2">
            Espace Membre
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            Connectez-vous pour accéder à votre espace personnel
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow-xl shadow-slate-200/70 rounded-3xl border border-slate-100 p-8 sm:p-10 transition-all">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-800 mb-2">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-bold text-slate-800">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetStatus(null);
                    setShowResetModal(true);
                  }}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-4 pr-11 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs font-medium">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit Button (Teal Theme) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-teal-600/25 hover:shadow-teal-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Forgot Password Reset Request Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-teal-600">
              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-100 text-teal-600">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Réinitialisation du mot de passe</h3>
                <p className="text-xs text-slate-500 font-medium">Saisissez votre e-mail pour recevoir un lien</p>
              </div>
            </div>

            {resetStatus ? (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-medium ${
                resetStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {resetStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                )}
                <p className="leading-relaxed">{resetStatus.message}</p>
              </div>
            ) : null}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Adresse e-mail du compte
                </label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <span>Envoyer le lien</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Connexion;
