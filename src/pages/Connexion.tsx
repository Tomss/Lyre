import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Music, 
  X, 
  CheckCircle2, 
  KeyRound 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const LOGO_URL = 'https://res.cloudinary.com/dr2sbjrms/image/upload/v1774629447/lyre-uploads/ll5sutyvmfrocohfv3yd.png';

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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center py-16 px-4 sm:px-6">
      
      {/* Background Animated Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Decorative Floating Musical Note Watermarks */}
      <div className="absolute top-12 left-1/4 text-indigo-500/10 pointer-events-none select-none text-8xl font-serif">
        ♪
      </div>
      <div className="absolute bottom-16 right-1/4 text-purple-500/10 pointer-events-none select-none text-9xl font-serif">
        ♫
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Top Header & Logo Card */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl shadow-indigo-950/40 hover:scale-105 transition-transform duration-300">
            <img 
              src={LOGO_URL} 
              alt="La Lyre" 
              className="h-14 w-auto object-contain drop-shadow-md"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 rounded-full text-xs font-semibold text-indigo-300 mb-2">
              <Music className="w-3.5 h-3.5 text-indigo-400" />
              <span>Société Philharmonique La Lyre</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Espace Membre
            </h1>
            <p className="text-slate-400 text-sm mt-1.5 font-medium">
              Connectez-vous pour accéder à votre espace d'orchestre
            </p>
          </div>
        </div>

        {/* Main Glassmorphic Login Card */}
        <div className="bg-white/95 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-slate-950/60 rounded-3xl p-7 sm:p-9 transition-all">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Adresse e-mail
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="nom.prenom@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetStatus(null);
                    setShowResetModal(true);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
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
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Security Footer Note */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Espace sécurisé SSL • La Lyre</span>
          </div>
        </div>

      </div>

      {/* Forgot Password Reset Request Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowResetModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-indigo-600">
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-indigo-600">
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
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
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
