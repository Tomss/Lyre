import { Link, useLocation } from 'react-router-dom';
import { Facebook, Youtube, Music, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config';

const Footer = () => {
  const location = useLocation();
  const { settings } = useTheme();
  const { isAuthenticated } = useAuth();
  
  const containerClass = "w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12";

  const quickLinks = [
    { path: '/', label: 'Accueil' },
    { path: '/school', label: 'L\'école' },
    { path: '/orchestres', label: 'Orchestres' },
    { path: '/media', label: 'Médias' },
    { path: '/contact', label: 'Contact' },
  ];

  const logoUrl = settings?.header_logo_url || settings?.site_logo_url;
  const fullLogoUrl = logoUrl ? (logoUrl.startsWith('http') ? logoUrl : `${BASE_URL}${logoUrl}`) : null;

  return (
    <footer className="bg-slate-900 text-slate-300 relative border-t border-slate-800/80 overflow-hidden">
      
      {/* Top Gradient Accent Bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-24 bg-teal-500/5 blur-3xl pointer-events-none" />

      <div className={`${containerClass} py-8 relative z-10`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            {fullLogoUrl ? (
              <img
                src={fullLogoUrl}
                alt="La Lyre"
                className="h-9 w-auto object-contain brightness-110"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Music className="w-5 h-5" />
              </div>
            )}
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block">
                La Lyre <span className="text-teal-400 font-bold">- Chalindrey</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">
                École de Musique & Ensembles Musical
              </span>
            </div>
          </div>

          {/* Quick Links Navigation */}
          <nav aria-label="Navigation pied de page">
            <ul className="flex items-center flex-wrap justify-center gap-1 sm:gap-2 text-xs font-semibold">
              {quickLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Social Links (Facebook & YouTube Only) */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase hidden xl:inline-block mr-1">
              Nous suivre :
            </span>
            
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-[#1877F2]/20 border border-slate-700/60 hover:border-[#1877F2]/50 rounded-xl text-slate-300 hover:text-[#1877F2] transition-all shadow-sm hover:shadow-[#1877F2]/10"
              aria-label="Facebook de La Lyre"
            >
              <Facebook className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="text-xs font-bold">Facebook</span>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-[#FF0000]/20 border border-slate-700/60 hover:border-[#FF0000]/50 rounded-xl text-slate-300 hover:text-[#FF0000] transition-all shadow-sm hover:shadow-[#FF0000]/10"
              aria-label="Chaîne YouTube de La Lyre"
            >
              <Youtube className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="text-xs font-bold">YouTube</span>
            </a>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Member Login Link */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-400">
          <p>
            © {new Date().getFullYear()} La Lyre - Chalindrey. Tous droits réservés.
          </p>

          <Link
            to={isAuthenticated ? "/dashboard" : "/connexion"}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-teal-400 font-semibold transition-colors group"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500 group-hover:scale-110 transition-transform" />
            <span>{isAuthenticated ? "Accéder au Tableau de bord" : "Espace Membre"}</span>
          </Link>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
