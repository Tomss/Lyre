import React, { useEffect } from 'react';
import { Users, Calendar, Music2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import PartnersSection from '../components/PartnersSection';
import HomeNewsSection from '../components/HomeNewsSection';
import HomeAgendaSection from '../components/HomeAgendaSection';
import { API_URL } from '../config';

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [backgroundImages, setBackgroundImages] = React.useState<string[]>([]);

  // Fallback images
  const defaultImages = [
    'https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1327430/pexels-photo-1327430.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
  ];

  const { settings } = useTheme();

  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        const response = await fetch(`${API_URL}/carousel`);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setBackgroundImages(data.map((item: any) => item.image_url));
          } else {
            setBackgroundImages(defaultImages);
          }
        } else {
          setBackgroundImages(defaultImages);
        }
      } catch (error) {
        console.error('Error fetching carousel images:', error);
        setBackgroundImages(defaultImages);
      }
    };

    fetchCarouselImages();
  }, []);

  useEffect(() => {
    if (backgroundImages.length === 0) return;

    // Carousel d'images de fond
    const intervalTime = parseInt(settings.carousel_interval || '5000');
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, intervalTime);

    return () => {
      clearInterval(imageInterval);
    };
  }, [backgroundImages, settings.carousel_interval]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-inter">
      {/* Hero Section - Classic Carousel Version */}
      <section id="accueil" className="relative min-h-screen flex items-center py-24 md:py-32 justify-center bg-gray-900 overflow-hidden">
        {/* Images de fond avec transition */}
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6)), url("${image}")` }}
          />
        ))}
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center justify-center text-center">
            <h1 className="flex flex-col items-center gap-4 font-poppins font-bold text-white mb-8 animate-fade-in-up">
              <span className="text-7xl md:text-[8rem] tracking-tighter drop-shadow-2xl leading-none">
                La <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500">Lyre</span>
              </span>
              <div className="h-1 w-24 md:w-32 bg-gradient-to-r from-transparent via-teal-400 to-transparent my-2 opacity-80"></div>
              <span className="text-xl md:text-3xl font-light tracking-[0.3em] uppercase text-white/90 drop-shadow-lg text-center">
                École de Musique de Chalindrey
              </span>
            </h1>
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
        {/* Decorative Background Elements - More vivid and modern */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-teal-50/40 rounded-full blur-[120px] pointer-events-none opacity-60"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-cyan-50/40 rounded-full blur-[100px] pointer-events-none opacity-50"></div>
        
        {/* Large faint background text for depth */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25rem] font-black text-slate-50 select-none pointer-events-none z-0 opacity-[0.35] font-poppins tracking-tighter uppercase whitespace-nowrap">
          L'AME DE LA MUSIQUE
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-16 animate-on-scroll">
              <h2 className="font-poppins font-bold text-3xl md:text-5xl text-slate-900 mb-6 relative inline-block">
                Qui sommes-nous ?
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-sm shadow-teal-100"></div>
              </h2>
            </div>
            
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24 animate-on-scroll">
               {/* Site Logo - Floating & Vivid */}
               <div className="lg:w-2/5 flex justify-center order-2 lg:order-1">
                 <div className="relative group/logo">
                   {/* Layered glowing effects */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-tr from-teal-500/10 via-cyan-400/5 to-transparent rounded-full blur-[90px] animate-pulse-slow"></div>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-white/40 rounded-full blur-3xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-1000"></div>
                   
                   <div className="relative animate-float">
                      <img 
                        src={settings.secondary_logo_url || settings.site_logo_url || "/lyre-logo.png"} 
                        alt="Logo de La Lyre" 
                        className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.08)] transition-all duration-1000 group-hover/logo:scale-110 group-hover/logo:rotate-3"
                      />
                   </div>
                 </div>
               </div>

               {/* Content - Modern Typography with Original Text */}
               <div className="lg:w-3/5 text-center lg:text-left space-y-12 order-1 lg:order-2">
                  <div className="relative">
                    {/* Quotation mark decoration */}
                    <div className="absolute -top-10 -left-6 text-teal-100/50 text-9xl font-serif pointer-events-none select-none -z-10">“</div>
                    
                    <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-poppins font-light tracking-wide">
                       <strong className="font-bold text-slate-900 border-b-4 border-teal-500/10 pb-1">Association musicale fondée en 1886</strong>, La Lyre, de croches en noires, de répétitions en répétitions, de concerts en concerts, de voyages en rivages, motive jeunes et moins jeunes, sages et exubérants, à vivre et partager ce langage aux mille et une harmoniques...
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 group">
                      <div className="h-0.5 w-12 bg-teal-500/30 group-hover:w-20 group-hover:bg-teal-500 transition-all duration-500 rounded-full hidden lg:block"></div>
                      <p className="text-2xl md:text-3xl text-slate-800 font-poppins leading-tight">
                        L’association <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 font-extrabold tracking-tight">LYRE</span>, c'est un <strong className="font-bold">orchestre d'Harmonie</strong>.
                      </p>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 group">
                      <div className="h-0.5 w-12 bg-cyan-500/30 group-hover:w-20 group-hover:bg-cyan-500 transition-all duration-500 rounded-full hidden lg:block"></div>
                      <p className="text-2xl md:text-3xl text-slate-800 font-poppins leading-tight">
                        Et c'est aussi une <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600 font-extrabold tracking-tight">ÉCOLE</span> fixant les bases musicales indispensables.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 relative inline-block">
                    <p className="italic text-teal-700 text-lg md:text-xl font-medium relative z-10">
                      Spectateurs à l'ouïe fine, futur(e)s virtuoses ou simples curieux(se)s, prenez le temps de parcourir notre site..
                    </p>
                    <div className="absolute bottom-0 left-0 w-full h-3 bg-teal-50 -z-10 -rotate-1 rounded-sm"></div>
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

      {/* Section Rejoignez-nous */}
      <section id="rejoignez-nous" className="scroll-mt-20 py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-teal-500/20">
              <Music2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="font-poppins font-bold text-3xl text-slate-800 mb-6">Rejoignez-nous</h2>
            <p className="font-inter text-slate-600 leading-relaxed mb-6">
              Chaque concert est une nouvelle page de notre histoire musicale. Venez partager ces moments d'émotion et de partage avec La Lyre Cheminote et Municipale de Chalindrey.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center group">
                <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-4 transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-2xl group-hover:border-teal-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-4 group-hover:text-teal-500 group-hover:scale-110 transition-all duration-500" />
                  <h3 className="font-bold text-slate-800 text-lg mb-2">Concerts réguliers</h3>
                  <p className="text-slate-500 text-sm">Plusieurs représentations par an</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-4 transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-2xl group-hover:border-indigo-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Users className="h-10 w-10 text-slate-400 mx-auto mb-4 group-hover:text-indigo-500 group-hover:scale-110 transition-all duration-500" />
                  <h3 className="font-bold text-slate-800 text-lg mb-2">Tous niveaux</h3>
                  <p className="text-slate-500 text-sm">De l'éveil au niveau supérieur</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-4 transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-2xl group-hover:border-cyan-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Music2 className="h-10 w-10 text-slate-400 mx-auto mb-4 group-hover:text-cyan-500 group-hover:scale-110 transition-all duration-500" />
                  <h3 className="font-bold text-slate-800 text-lg mb-2">Répertoire varié</h3>
                  <p className="text-slate-500 text-sm">Classique, moderne, populaire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >
    </div >
  );
};

export default Home;