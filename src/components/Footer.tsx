import { Link, useLocation } from 'react-router-dom';
import { Facebook, Youtube, Music } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BASE_URL } from '../config';

const Footer = () => {
  const location = useLocation();
  const { settings } = useTheme();
  
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

      <div className={`${containerClass} py-4 relative z-10`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand & Logo (No subtitle) */}
          <div className="flex items-center gap-2.5">
            {fullLogoUrl ? (
              <img
                src={fullLogoUrl}
                alt="La Lyre"
                className="h-7 w-auto object-contain brightness-110"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Music className="w-4 h-4" />
              </div>
            )}
            <span className="font-extrabold text-sm text-white tracking-tight">
              La Lyre <span className="text-teal-400 font-bold">- Chalindrey</span>
            </span>
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
                      className={`px-2.5 py-1 rounded-lg transition-all ${
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
          <div className="flex items-center gap-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/90 hover:bg-[#1877F2]/20 border border-slate-700/60 hover:border-[#1877F2]/50 rounded-lg text-slate-300 hover:text-[#1877F2] transition-all shadow-xs text-xs font-bold"
              aria-label="Facebook de La Lyre"
            >
              <Facebook className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
              <span>Facebook</span>
            </a>

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/90 hover:bg-[#FF0000]/20 border border-slate-700/60 hover:border-[#FF0000]/50 rounded-lg text-slate-300 hover:text-[#FF0000] transition-all shadow-xs text-xs font-bold"
              aria-label="Chaîne YouTube de La Lyre"
            >
              <Youtube className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
              <span>YouTube</span>
            </a>
          </div>

        </div>

        {/* Centered Copyright Line */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-center text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} La Lyre - Chalindrey. Tous droits réservés.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
