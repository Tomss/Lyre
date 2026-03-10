import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Music, UserCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { settings } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Orchestras Dropdown Logic */
  const [orchestraLinks, setOrchestraLinks] = useState<{ label: string; path: string }[]>([]);

  useEffect(() => {
    const fetchOrchestras = async () => {
      try {
        const response = await fetch(`${API_URL}/public-orchestras`);
        if (response.ok) {
          const data = await response.json();
          const links = data.map((orch: any) => ({
            label: orch.name,
            path: `/orchestres#${orch.id}`
          }));
          setOrchestraLinks(links);
        }
      } catch (error) {
        console.error("Failed to fetch orchestras for menu", error);
      }
    };
    fetchOrchestras();
  }, []);

  const navLinks = [
    {
      path: '/',
      label: 'Accueil',
      dropdown: [
        { label: 'Qui sommes-nous ?', path: '/#la-lyre' },
        { label: 'Nos Actualités', path: '/#news' },
        { label: 'Agenda', path: '/#agenda' },
        { label: 'Nos Partenaires', path: '/#partenaires' },
        { label: 'Rejoignez-nous', path: '/#rejoignez-nous' }
      ]
    },
    {
      path: '/school',
      label: 'L\'école',
      dropdown: [
        { label: 'Notre École', path: '/school#presentation' },
        { label: 'Nos Classes & Professeurs', path: '/school#classes' },
        { label: 'L\'École c\'est aussi...', path: '/school#activites' },
        { label: 'Notre Histoire', path: '/school#histoire' }
      ]
    },
    {
      path: '/orchestres',
      label: 'Orchestres',
      dropdown: orchestraLinks.length > 0 ? orchestraLinks : undefined
    },
    { path: '/media', label: 'Médias' },
    { path: '/contact', label: 'Contact' },
  ];

  // Handle hash scrolling
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${!isScrolled
      ? 'bg-transparent'
      : 'bg-white shadow-lg border-b border-slate-100'
      }`}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-32">
          {/* Logo */}
          <Link to="/" className={`flex items-center space-x-2 font-poppins font-bold text-xl transition-colors ${isScrolled
            ? 'text-teal-800 hover:text-teal-600'
            : 'text-white hover:text-teal-200'
            }`}>
            {settings?.site_logo_url ? (
              <img src={settings.site_logo_url} alt="La Lyre" className="h-16 lg:h-32 w-auto object-contain transition-all duration-300" />
            ) : (
              <div className="flex items-center space-x-2">
                <Music className={`h-12 w-12 lg:h-16 lg:w-16 ${isScrolled
                  ? 'text-teal-600'
                  : 'text-teal-300'
                  }`} />
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <div key={link.path} className="relative group">
                <Link
                  to={link.path}
                  onClick={() => {
                    // Si on clique sur le lien principal, on remonte en haut
                    if (location.pathname === link.path) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`flex items-center gap-1 font-inter font-medium transition-all duration-200 hover:scale-105 ${location.pathname === link.path && !location.hash
                    ? (isScrolled
                      ? 'text-teal-600 font-semibold'
                      : 'text-teal-300 font-semibold')
                    : (isScrolled
                      ? 'text-gray-700 hover:text-teal-600'
                      : 'text-white/90 hover:text-white')
                    }`}
                >
                  {link.label}
                  {link.dropdown && (
                    <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                  )}
                </Link>

                {/* Dropdown Menu */}
                {link.dropdown && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top translate-y-4 group-hover:translate-y-0">
                    <div className="relative bg-slate-950/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] border border-teal-500/20 p-3 w-[260px] overflow-hidden">
                      {/* Glowing orb effect in background */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      
                      {link.dropdown.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => {
                            if (location.pathname === '/' && subItem.path.startsWith('/#')) {
                              const el = document.getElementById(subItem.path.substring(2));
                              el?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="relative flex items-center px-4 py-3 mx-1 my-1 text-sm font-medium text-slate-300 rounded-xl transition-all duration-300 hover:text-white group/item overflow-hidden"
                        >
                          {/* Hover background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 translate-x-[-100%] group-hover/item:translate-x-0 transition-transform duration-300 z-0"></div>
                          {/* Left sliding border */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-400 scale-y-0 group-hover/item:scale-y-100 transition-transform duration-300 origin-center z-10 rounded-l-xl"></div>
                          
                          <span className="relative z-10 translate-x-0 group-hover/item:translate-x-2 transition-transform duration-300">
                            {subItem.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden lg:flex items-center space-x-3">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 font-inter font-medium px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg ${isScrolled
                    ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                    : 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm'
                    }`}
                >
                  <UserCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {`${currentUser.firstName} ${currentUser.lastName}`}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className={`font-inter font-medium px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 text-sm ${isScrolled
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
                className={`font-inter font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg ${isScrolled
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                  : 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg'
                  }`}
              >
                Espace Membre
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 rounded-lg transition-all duration-200 ${isScrolled
              ? 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
              : 'text-white hover:text-teal-200 hover:bg-white/10'
              }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-950/95 backdrop-blur-xl border-t border-teal-500/20 shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative">
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                <div key={link.path}>
                  <Link
                    to={link.path}
                    className={`block font-inter font-medium py-3 px-4 rounded-xl transition-all duration-300 ${location.pathname === link.path
                      ? 'text-white bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-l-2 border-teal-400 shadow-inner'
                      : 'text-slate-300 hover:text-teal-300 hover:bg-slate-800/50'
                      }`}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (location.pathname === link.path) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                  {link.dropdown && (
                    <div className="pl-6 mt-1 space-y-1 mb-3 border-l-2 border-slate-800/80 ml-4">
                      {link.dropdown.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            if (location.pathname === '/' && subItem.path.startsWith('/#')) {
                              const el = document.getElementById(subItem.path.substring(2));
                              el?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="block text-sm font-medium text-slate-400 hover:text-white py-2.5 px-3 rounded-lg hover:bg-gradient-to-r hover:from-teal-500/10 hover:to-transparent transition-all duration-300 hover:translate-x-1"
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile User Section */}
              <div className="pt-6 mt-4 border-t border-slate-800/60 space-y-3">
                {currentUser ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700/80 text-teal-400 font-inter font-medium px-4 py-3 rounded-xl border border-slate-700/50 transition-all duration-300 shadow-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <UserCircle className="h-5 w-5" />
                      <span>{`${currentUser.firstName} ${currentUser.lastName}`}</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left bg-transparent hover:bg-rose-500/10 text-rose-400 font-inter font-medium px-4 py-3 rounded-xl border border-rose-500/20 transition-all duration-300"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <Link
                    to="/connexion"
                    className="block bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-inter font-semibold px-6 py-3 rounded-xl transition-all duration-300 text-center shadow-lg shadow-teal-900/40"
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