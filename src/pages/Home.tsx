import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import PartnersSection from '../components/PartnersSection';
import HomeNewsSection from '../components/HomeNewsSection';
import HomeAgendaSection from '../components/HomeAgendaSection';
import { API_URL, BASE_URL } from '../config';
import Lenis from 'lenis';

const CAROUSEL_CACHE_KEY = 'lyre_cached_carousel_v1';

const Home = () => {
  // Initialize Lenis Cinematic Smooth Scroll on Homepage
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
  // Read cached real carousel images for instant frame-0 rendering with 0 stock photos
  const [backgroundImages, setBackgroundImages] = React.useState<string[]>(() => {
    try {
      const cached = localStorage.getItem(CAROUSEL_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // Ignore parse errors
    }
    return [];
  });

  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const { settings } = useTheme();

  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        const response = await fetch(`${API_URL}/carousel`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const urls = data.map((item: any) => 
               item.image_url.startsWith('http') ? item.image_url : `${BASE_URL}${item.image_url}`
            );
            setBackgroundImages(urls);
            try {
              localStorage.setItem(CAROUSEL_CACHE_KEY, JSON.stringify(urls));
            } catch (e) {}
          }
        }
      } catch (error) {
        console.error('Error fetching carousel images:', error);
      }
    };

    fetchCarouselImages();
  }, []);

  const [isHeroVisible, setIsHeroVisible] = React.useState(true);

  // Pause carousel when out of view to save 100% CPU/GPU on scroll
  useEffect(() => {
    const heroEl = document.getElementById('accueil');
    if (!heroEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (backgroundImages.length === 0 || !isHeroVisible) return;

    // Carousel d'images de fond (actif uniquement si visible à l'écran)
    const intervalTime = parseInt(settings.carousel_interval || '5000');
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, intervalTime);

    return () => {
      clearInterval(imageInterval);
    };
  }, [backgroundImages, settings.carousel_interval, isHeroVisible]);


  // Preload carousel images for instant smooth transitions
  useEffect(() => {
    if (backgroundImages.length > 0) {
      backgroundImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [backgroundImages]);

  return (
    <div className="">
      {/* Hero Section - Optimisé Ultra-Wide (Style Samsung) */}
      <section id="accueil" className="relative h-[calc(100vh-80px)] flex items-center justify-center bg-slate-900 overflow-hidden">
        {/* Active Hero Background Image - Single GPU Layer */}
        {backgroundImages.length > 0 && (
          <div className="absolute inset-0">
            <img
              key={backgroundImages[currentImageIndex]}
              src={backgroundImages[currentImageIndex]}
              alt="La Lyre"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 opacity-100"
            />
            <div className="absolute inset-0 bg-slate-950/50 z-1" />
          </div>
        )}
        
        <div className="w-full max-w-[2560px] mx-auto px-4 sm:px-10 lg:px-20 relative z-10 flex flex-col items-start justify-end pb-32 md:pb-48 h-full">
            {/* Main Title */}
            <h1 className="flex flex-col items-start font-poppins font-black text-white mb-10 animate-fade-in-left">
              <span className="text-6xl md:text-[8.5rem] leading-[0.95] tracking-tighter drop-shadow-2xl">
                La Lyre
              </span>
              <span className="text-4xl md:text-[5rem] leading-[1.1] tracking-tighter drop-shadow-2xl font-black mt-4 max-w-5xl">
                Ecole de musique <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">de Chalindrey</span>
              </span>
            </h1>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 animate-fade-in-left" style={{ animationDelay: '200ms' }}>
              <a href="#la-lyre" className="group relative px-8 py-4 bg-teal-600 text-white font-bold rounded-xl overflow-hidden transition-all hover:bg-teal-500 active:scale-95 flex items-center gap-2 shadow-lg shadow-teal-900/20">
                <span>Découvrir la Lyre</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link to="/contact" className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-slate-900 transition-all active:scale-95">
                Nous contacter
              </Link>
            </div>
        </div>

        {/* Indicateurs de carousel */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-teal-400 scale-125 shadow-[0_0_10px_rgba(45,212,191,0.8)]' : 'bg-white/40 hover:bg-white/60'}`}
              onClick={() => setCurrentImageIndex(index)}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Qui sommes-nous ? Section */}
      <section id="la-lyre" className="scroll-mt-20 py-24 bg-white relative overflow-hidden">
        {/* Soft Background Accents - Zero GPU Cost Radial Gradients */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(204,251,241,0.4)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(207,250,254,0.4)_0%,transparent_70%)] pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-16 animate-on-scroll">
              <h2 className="font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
                Qui sommes-nous ?
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-teal-500 rounded-full"></div>
              </h2>
            </div>
            
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20 animate-on-scroll">
               {/* Site Logo - Subtle Animation */}
               <div className="lg:w-1/3 flex justify-center order-2 lg:order-1">
                 <div className="relative group/logo">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-[radial-gradient(circle,rgba(13,148,136,0.1)_0%,transparent_70%)] pointer-events-none"></div>
                   <div className="relative">
                      <img 
                        src={settings.secondary_logo_url || settings.site_logo_url || "/lyre-logo.png"} 
                        alt="Logo de La Lyre" 
                        className="w-56 h-56 md:w-72 md:h-72 object-contain drop-shadow-lg transition-transform duration-1000 group-hover/logo:scale-105"
                      />
                   </div>
                 </div>
               </div>

               {/* Content - Clean & Balanced */}
               <div className="lg:w-2/3 text-center lg:text-left space-y-10 order-1 lg:order-2">
                  <p className="text-base md:text-lg text-slate-600 leading-relaxed font-light">
                     Association musicale fondée en 1886, La Lyre, de croches en noires, de répétitions en répétitions, de concerts en concerts, de voyages en rivages, motive jeunes et moins jeunes, sages et exubérants, à vivre et partager ce langage aux mille et une harmoniques...
                  </p>

                  <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 group">
                      <div className="h-px w-8 bg-blue-500/40 group-hover:w-12 group-hover:bg-blue-500 transition-all duration-500 rounded-full hidden lg:block"></div>
                      <p className="text-lg md:text-xl text-slate-800 font-medium">
                        L’association La Lyre, c'est un <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold">Orchestre d'Harmonie</span>.
                      </p>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 group">
                      <div className="h-px w-8 bg-indigo-500/40 group-hover:w-12 group-hover:bg-indigo-500 transition-all duration-500 rounded-full hidden lg:block"></div>
                      <p className="text-lg md:text-xl text-slate-800 font-medium">
                        Et c'est aussi une <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 font-extrabold">Ecole</span> fixant les bases musicales indispensables.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 inline-block">
                    <p className="italic text-teal-700/80 text-base font-medium">
                      Spectateurs à l'ouïe fine, futur(e)s virtuoses ou simples curieux(se)s, prenez le temps de parcourir notre site..
                    </p>
                  </div>
               </div>
            </div>
        </div>
      </section>

      {/* News Section */}
      <HomeNewsSection />

      {/* Agenda Section */}
      <HomeAgendaSection />

      {/* Partners Section */}
      <PartnersSection />

    </div >
  );
};

export default Home;
