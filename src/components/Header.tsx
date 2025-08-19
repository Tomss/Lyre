import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Music, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Accueil' },
    { path: '/school', label: 'L\'école' },
    { path: '/events', label: 'Événements' },
    { path: '/media', label: 'Médias' },
    { path: '/contact', label: 'Contact' },
  ];

  const isHomePage = location.pathname === '/';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled || !isHomePage 
        ? 'bg-white shadow-lg border-b border-orange-100' 
        : 'bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-sm'
    }`}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className={`flex items-center space-x-2 font-poppins font-bold text-xl transition-colors ${
            isScrolled || !isHomePage 
              ? 'text-orange-800 hover:text-orange-600' 
              : 'text-white hover:text-orange-200'
          }`}>
            <Music className={`h-8 w-8 ${
              isScrolled || !isHomePage ? 'text-orange-600' : 'text-orange-300'
            }`} />
            <span>La Lyre</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-inter font-medium transition-all duration-200 hover:scale-105 ${
                  location.pathname === link.path 
                    ? (isScrolled || !isHomePage 
                        ? 'text-orange-600 font-semibold' 
                        : 'text-orange-300 font-semibold') 
                    : (isScrolled || !isHomePage 
                        ? 'text-gray-700 hover:text-orange-600' 
                        : 'text-white/90 hover:text-white')
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 font-inter font-medium px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    isScrolled || !isHomePage
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-200'
                      : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm'
                  }`}
                >
                  <UserCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {profile ? `${profile.first_name} ${profile.last_name}` : 'Mon Espace'}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className={`font-inter font-medium px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 text-sm ${
                    isScrolled || !isHomePage
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                      : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm'
                  }`}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/connexion"
                className={`font-inter font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  isScrolled || !isHomePage
                    ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
                }`}
              >
                Espace Membre
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 rounded-lg transition-all duration-200 ${
              isScrolled || !isHomePage 
                ? 'text-gray-700 hover:text-orange-600 hover:bg-orange-50' 
                : 'text-white hover:text-orange-200 hover:bg-white/10'
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/98 backdrop-blur-md border-t border-orange-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block font-inter font-medium py-2 px-3 rounded-lg transition-all duration-200 ${
                    location.pathname === link.path 
                      ? 'text-orange-600 bg-orange-50 font-semibold' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile User Section */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-2 bg-orange-100 hover:bg-orange-200 text-orange-800 font-inter font-medium px-4 py-3 rounded-lg border border-orange-200 transition-all duration-300"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <UserCircle className="h-5 w-5" />
                      <span>{profile ? `${profile.first_name} ${profile.last_name}` : 'Mon Espace'}</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-inter font-medium px-4 py-3 rounded-lg border border-gray-200 transition-all duration-300"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <Link
                    to="/connexion"
                    className="block bg-orange-600 hover:bg-orange-700 text-white font-inter font-semibold px-6 py-3 rounded-lg transition-all duration-300 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Espace Membre
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;