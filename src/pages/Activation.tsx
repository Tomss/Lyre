import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';

const Activation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { logout, isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Password Policy Checks
  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password);

  const isPasswordPolicyValid = isMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecialChar;

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage("Le lien d'activation est invalide ou manquant.");
    }
    
    if (isAuthenticated) {
      console.log('[Activation.tsx] Active session detected, logging out for a clean activation environment.');
      logout(false);
    }
  }, [token, isAuthenticated, logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordPolicyValid) {
      setStatus('error');
      setMessage('Le mot de passe doit respecter toutes les règles de sécurité (8 caractères, majuscule, minuscule, chiffre et caractère spécial).');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'activation.");
      }

      setStatus('success');
      setMessage('Votre mot de passe a été défini avec succès ! Vous pouvez maintenant vous connecter à votre espace membre.');
      
      setTimeout(() => {
        navigate('/connexion');
      }, 3000);

    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token && status === 'error') {
    return (
      <div className="min-h-screen pt-12 pb-20 flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto justify-center mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Lien invalide ou expiré</h2>
          <p className="text-slate-600 text-sm mb-6">{message}</p>
          <Link to="/" className="text-teal-600 font-bold hover:text-teal-700">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-12 pb-20 flex items-center justify-center bg-slate-50 px-4 sm:px-6">
      <div className="max-w-md w-full">
        
        <div className="text-center mb-8">
          <div className="bg-teal-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-600/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Espace Membre</h2>
          <p className="mt-1.5 text-slate-600 text-sm font-medium">
            Définissez votre mot de passe sécurisé pour accéder à votre compte.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100 overflow-hidden">
          <div className="p-8">
            {status === 'success' ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">Mot de passe enregistré !</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
                <Link to="/connexion" className="inline-block w-full py-3.5 px-4 bg-teal-600 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-colors text-sm">
                  Se connecter à l'espace membre
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {status === 'error' && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-start text-left gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{message}</span>
                  </div>
                )}

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Votre nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Live Password Policy Checklist */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
                  <p className="font-bold text-slate-700">Politique de sécurité du mot de passe :</p>
                  <div className="space-y-1.5">
                    <div className={`flex items-center gap-2 font-medium ${isMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>8 caractères minimum</span>
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${hasUppercase ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>Au moins 1 majuscule (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${hasLowercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${hasLowercase ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>Au moins 1 minuscule (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${hasDigit ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${hasDigit ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>Au moins 1 chiffre (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${hasSpecialChar ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${hasSpecialChar ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>Au moins 1 caractère spécial (!@#$%...)</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Confirmez le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      placeholder="Répétez votre mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPasswordPolicyValid}
                  className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <span>Valider mon mot de passe</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activation;
