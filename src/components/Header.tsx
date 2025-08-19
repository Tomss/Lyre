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

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/98 backdrop-blur-md shadow-lg border-b border-orange-100' : 'bg-white/10 backdrop-blur-sm'
    }`}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className={`flex items-center space-x-2 font-poppins font-bold text-xl transition-colors ${
            isScrolled ? 'text-orange-800 hover:text-orange-600' : 'text-white hover:text-orange-200'
          }`}>
            <Music className={`h-8 w-8 ${isScrolled ? 'text-orange-600' : 'text-orange-300'}`} />
            <span>La Lyre</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-inter font-medium transition-colors ${
                  location.pathname === link.path 
                    ? (isScrolled ? 'text-orange-600' : 'text-orange-300') 
                    : (isScrolled ? 'text-gray-700 hover:text-orange-600' : 'text-orange-200 hover:text-white')
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Dynamic User Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 font-inter font-semibold px-4 py-2 rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                    isScrolled 
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200 hover:border-orange-300' 
                      : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50'
                  }`}
                >
                  <UserCircle className="h-5 w-5" />
                  <span>{profile ? `${profile.first_name} ${profile.last_name}` : 'Mon Espace'}</span>
                </Link>
                <button
                  onClick={logout}
                  className={`font-inter font-semibold px-4 py-2 rounded-full transition-all duration-300 ${
                    isScrolled 
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/connexion"
                className={`font-inter font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                  isScrolled 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-orange-400 hover:bg-orange-500 text-white'
                }`}
              >
                Espace Membre
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 transition-colors ${
              isScrolled ? 'text-gray-700 hover:text-orange-600' : 'text-white hover:text-orange-200'
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/98 backdrop-blur-md border-t border-orange-200">
            <div className="px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block font-inter font-medium transition-colors hover:text-orange-600 ${
                    location.pathname === link.path ? 'text-orange-600' : 'text-gray-700'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile User Section */}
              {user ? (
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-inter font-semibold px-4 py-2 rounded-full border border-orange-200 hover:border-orange-300 transition-all duration-300 mb-3"
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
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-inter font-semibold px-4 py-2 rounded-full transition-all duration-300"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link
                  to="/connexion"
                  className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-inter font-semibold px-6 py-3 rounded-full transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Espace Membre
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;