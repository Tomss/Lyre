import { Link, useLocation } from 'react-router-dom';
import { Facebook, Youtube, Instagram, Linkedin, Twitter, Music, Globe, Share2, Radio } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BASE_URL } from '../config';

interface SocialLink {
  id: string;
  platform: string;
  name: string;
  url: string;
  is_active: boolean;
}

const getSocialIcon = (platform: string) => {
  switch (platform?.toLowerCase()) {
    case 'facebook': return Facebook;
    case 'youtube': return Youtube;
    case 'instagram': return Instagram;
    case 'linkedin': return Linkedin;
    case 'twitter': return Twitter;
    case 'spotify': return Music;
    case 'soundcloud': return Radio;
    case 'tiktok': return Share2;
    default: return Globe;
  }
};

const getSocialColors = (platform: string) => {
  switch (platform?.toLowerCase()) {
    case 'facebook': return 'hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 hover:text-[#1877F2]';
    case 'youtube': return 'hover:bg-[#FF0000]/20 hover:border-[#FF0000]/50 hover:text-[#FF0000]';
    case 'instagram': return 'hover:bg-[#E4405F]/20 hover:border-[#E4405F]/50 hover:text-[#E4405F]';
    case 'linkedin': return 'hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/50 hover:text-[#0A66C2]';
    case 'twitter': return 'hover:bg-slate-700 hover:border-slate-500 hover:text-white';
    case 'tiktok': return 'hover:bg-[#25F4EE]/20 hover:border-[#25F4EE]/50 hover:text-[#25F4EE]';
    case 'spotify': return 'hover:bg-[#1DB954]/20 hover:border-[#1DB954]/50 hover:text-[#1DB954]';
    case 'soundcloud': return 'hover:bg-[#FF5500]/20 hover:border-[#FF5500]/50 hover:text-[#FF5500]';
    default: return 'hover:bg-teal-500/20 hover:border-teal-500/50 hover:text-teal-400';
  }
};

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

  // Parse dynamic social links from settings, with robust fallback
  const socialLinks: SocialLink[] = (() => {
    try {
      if (settings?.social_links) {
        const parsed = JSON.parse(settings.social_links);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((item: SocialLink) => item && item.is_active !== false && item.url);
        }
      }
    } catch (e) {}
    return [
      { id: '1', platform: 'facebook', name: 'Facebook', url: 'https://facebook.com', is_active: true },
      { id: '2', platform: 'youtube', name: 'YouTube', url: 'https://youtube.com', is_active: true }
    ];
  })();

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

          {/* Dynamic Social Links */}
          <div className="flex items-center flex-wrap justify-center gap-2">
            {socialLinks.map((link) => {
              const Icon = getSocialIcon(link.platform);
              const colorClasses = getSocialColors(link.platform);
              const fullUrl = link.url.startsWith('http://') || link.url.startsWith('https://') 
                ? link.url 
                : `https://${link.url}`;

              return (
                <a
                  key={link.id || link.name}
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/90 border border-slate-700/60 rounded-lg text-slate-300 transition-all shadow-xs text-xs font-bold ${colorClasses}`}
                  aria-label={`${link.name} de La Lyre`}
                  title={link.name}
                >
                  <Icon className="h-3.5 w-3.5 transition-transform group-hover:scale-110 flex-shrink-0" />
                  <span>{link.name}</span>
                </a>
              );
            })}
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
