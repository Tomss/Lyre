import { Link } from 'react-router-dom';
import { Music, Facebook, Instagram, Youtube } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BASE_URL } from '../config';

const Footer = () => {
  const { settings } = useTheme();
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
    <footer className="bg-dark text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: School Info */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2">
              {(settings?.header_logo_url || settings?.site_logo_url) ? (
                <img 
                  src={settings.header_logo_url?.startsWith('http') ? settings.header_logo_url : (settings.header_logo_url ? `${BASE_URL}${settings.header_logo_url}` : (settings.site_logo_url?.startsWith('http') ? settings.site_logo_url : `${BASE_URL}${settings.site_logo_url}`))} 
                  alt="La Lyre" 
                  className="h-12 w-auto object-contain" 
                />
              ) : (
                <>
                  <Music className="h-8 w-8 text-teal-400" />
                  <span className="font-poppins font-bold text-xl text-white">La Lyre</span>
                </>
              )}
            </Link>
            <div className="space-y-2">
              <p className="font-inter text-gray-300 font-medium">
                École de Musique La Lyre
              </p>
              <p className="font-inter text-sm text-gray-400 italic">
                Exprimez la musique qui est en vous
              </p>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="font-poppins font-semibold text-lg">Liens rapides</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="font-inter text-gray-300 hover:text-accent transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Social Media */}
          <div className="space-y-4">
            <h3 className="font-poppins font-semibold text-lg">Suivez-nous</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2 bg-gray-700 hover:bg-accent rounded-full transition-all duration-300 hover:-translate-y-1"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-center">
          <p className="font-inter text-gray-400 text-sm">
            © 2025 École de Musique La Lyre. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;