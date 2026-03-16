import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Connexion = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('[Connexion.tsx] handleLogin triggered');
    setLoading(true);
    setError(null);
    setNotification(prev => ({ ...prev, show: false }));

    try {
      console.log(`[Connexion.tsx] Calling login with email: ${email}`);
      await login(email, password);
      console.log('[Connexion.tsx] Login call successful');
      // La redirection est gérée dans le contexte d'authentification
    } catch (err: any) {
      console.error('[Connexion.tsx] Login failed:', err);
      const msg = err.message || 'Une erreur est survenue lors de la connexion.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter pt-32 pb-20 bg-gradient-to-br from-orange-50 via-amber-25 to-yellow-25 min-h-screen">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md relative">
        <div className="text-center mb-8">
          <h1 className="font-poppins font-bold text-3xl text-dark mb-2">
            Espace Membre
          </h1>
          <p className="font-inter text-gray-600">
            Connectez-vous pour accéder à votre espace personnel
          </p>
        </div>
        
        <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark mb-2">
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                
                {error && (
                  <div style={{
                    marginTop: '1rem',
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecaca',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '0.75rem'
                  }}>
                    <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b', fontWeight: '500' }}>{error}</p>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connexion;
