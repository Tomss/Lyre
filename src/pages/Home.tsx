import React, { useEffect } from 'react';
import { Users, Calendar, Music2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

import PartnersSection from '../components/PartnersSection';
import HomeNewsSection from '../components/HomeNewsSection';
import HomeAgendaSection from '../components/HomeAgendaSection';
import { API_URL } from '../config';

const Home = () => {
  const [backgroundImages, setBackgroundImages] = React.useState<string[]>([]);

  // Images par défaut (fallback)
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
      {/* Hero Section: Animated Multi-Column Photo Wall */}
      <section id="accueil" className="relative h-screen w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Background Photo Wall - Disordered & Asymmetrical */}
        <div className="absolute inset-0 flex gap-4 md:gap-8 opacity-50 scale-110 pointer-events-none px-4">
          {[0, 1, 2, 3].map((colIndex) => {
            // Distribute images across 4 columns
            const colImages = [...backgroundImages, ...backgroundImages].filter((_, i) => i % 4 === colIndex);
            // Ensure we have enough images for the scroll to look seamless
            const displayImages = [...colImages, ...colImages, ...colImages];
            
            // Uniqueness per column
            const columnOffsets = ['-mt-12', 'mt-24', '-mt-32', 'mt-10'];
            const animationSpeeds = ['60s', '45s', '70s', '55s'];
            
            return (
              <div 
                key={colIndex} 
                className={`flex-1 flex flex-col gap-4 md:gap-8 ${columnOffsets[colIndex]} ${
                  colIndex % 2 === 0 ? 'animate-scroll-vertical' : 'animate-scroll-vertical-reverse'
                }`}
                style={{ animationDuration: animationSpeeds[colIndex] }}
              >
                {displayImages.map((image, imgIndex) => (
                  <div 
                    key={imgIndex}
                    className="aspect-[3/4] rounded-3xl bg-cover bg-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-float transition-all duration-700"
                    style={{ 
                      backgroundImage: `url("${image}")`,
                      animationDelay: `${imgIndex * 0.7 + colIndex * 1.5}s`,
                      animationDuration: `${14 + colIndex * 3}s`,
                      transform: `rotate(${(imgIndex % 2 === 0 ? 1 : -1) * (1 + (imgIndex % 3))}deg)`
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Floating Title Only */}
        <div className="relative z-20 container mx-auto px-4 flex flex-col items-center justify-center min-h-screen">
            <h1 className="flex flex-col items-center gap-4 font-poppins font-extrabold text-white select-none animate-fade-in">
              <span className="text-8xl md:text-[14rem] tracking-tighter leading-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] flex items-center">
                La <span className="text-transparent bg-clip-text bg-gradient-to-br from-teal-200 via-emerald-400 to-cyan-400 ml-4 md:ml-12">Lyre</span>
              </span>
            </h1>
        </div>

        {/* Elegant Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.5em] text-white/30 font-bold hidden md:block">Explorer</span>
            <div className="w-[2px] h-16 rounded-full bg-gradient-to-b from-teal-500 via-teal-500/50 to-transparent animate-bounce"></div>
        </div>
      </section>

      {/* Nouvelle Section La Lyre */}
      <section id="la-lyre" className="scroll-mt-20 py-20 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-12 animate-on-scroll">
              <h2 className="text-3xl md:text-5xl font-poppins font-bold text-slate-800 mb-6 relative inline-block">
                Qui sommes-nous ?
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-teal-500 rounded-full"></div>
              </h2>
            </div>
            
            <div className="max-w-3xl mx-auto text-center space-y-8 animate-on-scroll">
               <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                  <strong className="font-semibold text-slate-800">Association musicale fondée en 1886</strong>, La Lyre, de croches en noires, de répétitions en répétitions, de concerts en concerts, de voyages en rivages, motive jeunes et moins jeunes, sages et exubérants, à vivre et partager ce langage aux mille et une harmoniques...
               </p>

               <div className="group relative bg-white rounded-3xl p-8 md:p-14 shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-500 animate-on-scroll">
                 {/* Internal glow effects on hover */}
                 <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                 
                 <p className="relative z-10 text-xl md:text-2xl text-slate-700 leading-relaxed mb-8 group-hover:text-slate-900 transition-colors">
                    L’association <strong className="text-teal-600 font-bold">LYRE</strong>, c'est un <strong className="font-bold text-slate-800">orchestre d'Harmonie</strong>.
                 </p>
                 <div className="w-24 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-auto my-8 group-hover:scale-x-150 transition-transform duration-700"></div>
                 <p className="relative z-10 text-xl md:text-2xl text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                    Et c'est aussi une <strong className="text-teal-600 font-bold">ÉCOLE</strong> fixant les bases musicales indispensables pour gravir les échelons du Grand Orchestre.
                 </p>
               </div>

               <p className="italic text-teal-700 text-lg md:text-xl font-medium mt-8 pt-6 border-t border-slate-200 inline-block">
                  Spectateurs à l'ouïe fine, futur(e)s virtuoses ou simples curieux(se)s, prenez le temps de parcourir notre site..
               </p>
            </div>
        </div>
      </section>

      {/* History Section */}



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