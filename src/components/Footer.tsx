import { Link, useLocation } from 'react-router-dom';
import { Facebook, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  const location = useLocation();
  const containerClass = "w-full px-4 sm:px-8 lg:px-12";

  const quickLinks = [
    { path: '/', label: 'Accueil' },
    { path: '/school', label: 'L\'école' },
    { path: '/orchestres', label: 'Orchestres' },
    { path: '/media', label: 'Médias' },
    { path: '/contact', label: 'Contact' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className={`${containerClass} py-6`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Column 1: School Info */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-slate-200">
              École de Musique La Lyre
            </span>
          </div>

          {/* Column 2: Quick Links */}
          <ul className="flex items-center flex-wrap gap-4 text-xs font-medium">
            {quickLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="text-slate-400 hover:text-teal-400 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Column 3: Social Media */}
          <div className="flex items-center space-x-2">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="p-1.5 bg-slate-800 hover:bg-teal-600 rounded-lg text-slate-300 hover:text-white transition-all"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <p className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} École de Musique La Lyre. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
