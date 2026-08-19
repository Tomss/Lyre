import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Music, UserCircle, ChevronDown, User, LogOut, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_URL, BASE_URL } from '../config';

const Header = () => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { settings } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (isMobileMenuOpen) {
        setIsVisible(true);
        return;
      }

      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        if (currentScrollY - lastScrollYRef.current > 15) {
          setIsVisible(false);
        }
      } else {
        if (lastScrollYRef.current - currentScrollY > 15 || currentScrollY <= 100) {
          setIsVisible(true);
        }
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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
        { label: 'Nos Actualités', path: '/#actualites' },
        { label: 'Agenda', path: '/#agenda' },
        { label: 'Nos Partenaires', path: '/#partenaires' }
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
    {
      path: '/media',
      label: 'Médias',
      dropdown: [
        { label: 'Notre Médiathèque', path: '/media#mediatheque' },
        { label: 'Partagez vos souvenirs', path: '/media#contribuer' }
      ]
    },
    {
      path: '/contact',
      label: 'Contact',
      dropdown: [
        { label: 'Où nous trouver ?', path: '/contact#localisation' },
        { label: 'Nous écrire', path: '/contact#formulaire' }
      ]
    },
  ];

  const handleScrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const isScrollingDown = elementPosition > window.scrollY;
      const offsetPosition = isScrollingDown ? elementPosition : elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        handleScrollToSection(location.hash.substring(1));
      }, 100);
    }
  }, [location]);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isUserMenuOpen && !target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const isFullWidthPage = location.pathname === '/dashboard' || location.pathname.startsWith('/admin');
  const containerClass = isFullWidthPage 
    ? "w-full px-4 sm:px-10 lg:px-16" 
    : "container mx-auto px-4 sm:px-6 lg:px-8";

  return (
    <header className={`sticky top-0 left-0 right-0 z-50 transition-transform duration-200 ease-out will-change-transform ${isVisible ? 'translate-y-0' : '-translate-y-full'
      } bg-white shadow-xs`}>
      <nav className={containerClass}>
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center space-x-3 group">
            {(settings?.header_logo_url || settings?.site_logo_url) ? (
              <div className="flex items-center gap-3">
                <img src={settings.header_logo_url?.startsWith('http') ? settings.header_logo_url : (settings.header_logo_url ? `${BASE_URL}${settings.header_logo_url}` : (settings.site_logo_url?.startsWith('http') ? settings.site_logo_url : `${BASE_URL}${settings.site_logo_url}`))} alt="La Lyre" className="h-10 lg:h-16 w-auto object-contain transition-all duration-300 group-hover:scale-105" />
                <span className="hidden sm:block font-bold text-xl lg:text-2xl tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  La <span className="text-teal-600">Lyre</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Music className="h-8 w-8 lg:h-10 lg:w-10 text-teal-600" />
              </div>
            )}
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex flex-1 justify-center items-center space-x-8">
            {navLinks.map((link, index) => (
              <div
                key={link.path}
                className="relative group"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  to={link.path}
                  onClick={() => {
                    if (location.pathname === link.path) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`flex items-center gap-1 font-medium transition-all duration-200 hover:scale-105 ${location.pathname === link.path && !location.hash
                    ? 'text-teal-600 font-semibold'
                    : 'text-gray-700 hover:text-teal-600'
                    }`}
                >
                  {link.label}
                  {link.dropdown && (
                    <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                  )}
                </Link>

                {link.dropdown && (
                  <div className={`absolute top-full ${index === navLinks.length - 1 ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} pt-6 transition-all duration-300 transform ${activeDropdown === link.label ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-4'
                    }`}>
                    <div className="relative bg-slate-950/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] border border-teal-500/20 p-3 w-[260px] overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      
                      {link.dropdown.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={(e) => {
                            setActiveDropdown(null);
                            if (location.pathname === '/' && subItem.path.startsWith('/#')) {
                              e.preventDefault();
                              const targetId = subItem.path.substring(2);
                              window.history.pushState({}, '', subItem.path);
                              handleScrollToSection(targetId);
                            } else if (location.pathname === '/school' && subItem.path.startsWith('/school#')) {
                              e.preventDefault();
                              const targetId = subItem.path.split('#')[1];
                              window.history.pushState({}, '', subItem.path);
                              handleScrollToSection(targetId);
                            } else if (location.pathname === '/media' && subItem.path.startsWith('/media#')) {
                              e.preventDefault();
                              const targetId = subItem.path.split('#')[1];
                              window.history.pushState({}, '', subItem.path);
                              handleScrollToSection(targetId);
                            } else if (location.pathname === '/contact' && subItem.path.startsWith('/contact#')) {
                              e.preventDefault();
                              const targetId = subItem.path.split('#')[1];
                              window.history.pushState({}, '', subItem.path);
                              handleScrollToSection(targetId);
                            }
                          }}
                          className="relative flex items-center px-4 py-3 mx-1 my-1 text-sm font-medium text-slate-300 rounded-xl transition-all duration-300 hover:text-white group/item overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 translate-x-[-100%] group-hover/item:translate-x-0 transition-transform duration-300 z-0"></div>
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

          {/* Right Side Actions (Desktop User + Mobile Toggle) */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center">
              {currentUser ? (
                <div 
                  className="relative user-menu-container group/menu"
                  onMouseEnter={() => setIsUserMenuOpen(true)}
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center space-x-3 font-medium pl-1.5 pr-4 py-1.5 rounded-xl transition-all duration-300 border shadow-sm relative overflow-hidden active:scale-95 ${
                      isUserMenuOpen 
                        ? 'bg-teal-50 border-teal-200 text-teal-800 shadow-md' 
                        : 'bg-white border-gray-200 text-slate-700 hover:border-teal-200 hover:bg-slate-50 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${
                      isUserMenuOpen 
                        ? 'bg-teal-600 text-white scale-110' 
                        : 'bg-teal-50 text-teal-600 group-hover/menu:bg-teal-600 group-hover/menu:text-white group-hover/menu:scale-110'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold tracking-tight pr-1">
                      {`${currentUser.firstName} ${currentUser.lastName.toUpperCase()}`}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180 text-teal-600' : 'text-slate-400 group-hover/menu:text-teal-500'}`} />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 pt-2 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 origin-top-right">
                      <div className="w-56 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-100 py-2 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-gray-50/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Session active</p>
                          <p className="text-xs font-bold text-teal-700 truncate">{currentUser.email}</p>
                        </div>
                        <Link 
                          to="/dashboard" 
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors font-medium mx-2 rounded-xl"
                        >
                          <UserCircle className="h-4 w-4 opacity-70" />
                          <span>Mes infos / Dashboard</span>
                        </Link>
                        <div className="h-px bg-gray-50 mx-2 my-1"></div>
                        <button 
                          onClick={() => { logout(); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-bold mx-2 rounded-xl text-left"
                        >
                          <LogOut className="h-4 w-4 opacity-70" />
                          <span>Se déconnecter</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/connexion"
                  className="font-bold px-7 py-3 rounded-xl transition-all duration-300 border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white shadow-sm hover:shadow-teal-500/20 active:scale-95 text-sm"
                >
                  Se connecter
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-teal-600 hover:bg-teal-50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Outside nav with solid theme-matched background */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed left-0 right-0 bottom-0 top-16 z-[100] bg-white border-t border-gray-100 shadow-2xl overflow-y-auto overscroll-contain transition-all duration-300"
          style={{ height: 'calc(100vh - 64px)' }}
        >
          <div className="px-4 py-8 space-y-2 min-h-full pb-32">
            {navLinks.map((link) => (
              <div key={link.path}>
                <Link
                  to={link.path}
                  className={`block font-medium py-3.5 px-4 rounded-xl transition-all duration-300 ${location.pathname === link.path
                    ? 'text-teal-700 bg-teal-50 border-l-4 border-teal-500'
                    : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
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
                  <div className="pl-6 mt-1 space-y-1 mb-4 border-l-2 border-gray-100 ml-4">
                    {link.dropdown.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        onClick={(e) => {
                          setIsMobileMenuOpen(false);
                          if (location.pathname === '/' && subItem.path.startsWith('/#')) {
                            e.preventDefault();
                            const targetId = subItem.path.substring(2);
                            window.history.pushState({}, '', subItem.path);
                            handleScrollToSection(targetId);
                          } else if (location.pathname === '/school' && subItem.path.startsWith('/school#')) {
                            e.preventDefault();
                            const targetId = subItem.path.split('#')[1];
                            window.history.pushState({}, '', subItem.path);
                            handleScrollToSection(targetId);
                          } else if (location.pathname === '/contact' && subItem.path.startsWith('/contact#')) {
                            e.preventDefault();
                            const targetId = subItem.path.split('#')[1];
                            window.history.pushState({}, '', subItem.path);
                            handleScrollToSection(targetId);
                          }
                        }}
                        className="block text-sm font-medium text-gray-500 hover:text-teal-600 py-3 px-3 rounded-lg hover:bg-teal-50/50 transition-all duration-300 hover:translate-x-1"
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile User Section */}
            <div className="pt-10 mt-8 border-t border-gray-100 space-y-4">
              {currentUser ? (
                <>
                  <div className="flex items-center space-x-4 p-4 bg-teal-50/50 rounded-2xl border border-teal-100 mb-2">
                    <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white shadow-md">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-teal-900 leading-tight">{`${currentUser.firstName} ${currentUser.lastName.toUpperCase()}`}</p>
                      <p className="text-xs text-teal-600 font-medium">Membre connecté</p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-3 w-full p-4 rounded-xl text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Info className="h-5 w-5 text-gray-400" />
                    <span className="font-semibold">Mes infos / Dashboard</span>
                  </Link>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center space-x-3 w-full p-4 rounded-xl text-rose-600 hover:bg-rose-50 transition-all font-bold active:scale-95"
                  >
                    <LogOut className="h-5 w-5 text-rose-400" />
                    <span>Se déconnecter</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/connexion"
                  className="block w-full bg-slate-900 text-white text-center font-bold py-5 rounded-xl hover:bg-teal-600 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
